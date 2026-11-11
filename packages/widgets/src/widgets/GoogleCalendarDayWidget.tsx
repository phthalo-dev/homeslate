import { useState, useMemo, useCallback } from "react";
import {
  Text,
  Stack,
  TextField,
  TextAreaField,
  NumberInput,
  HStack,
  Surface,
  Spinner,
  Button,
  MultiSelector,
  Select,
  Switch,
  Alert,
  Badge,
  Dialog,
  ScrollArea,
  IconButton,
  Divider,
} from "@var-ui/react";
import {
  IconCalendarEvent,
  IconRefresh,
  IconMapPin,
  IconClock,
  IconCalendar,
  IconFileText,
  IconPlus,
} from "@tabler/icons-react";
import { GoogleCalendarEmptyState } from "../chrome/GoogleCalendarEmptyState";
import type { WidgetProps, WidgetConfig } from "../types";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { useDisplayCalendar } from "../hooks/useDisplayCalendar";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useGoogleRuntime } from "../googleRuntime";
import type { ParsedCalendarEvent, CalendarEventInput } from "../services/googleCalendar";
import {
  displayCalendarEmptyDetail,
  shouldShowGoogleCalendarErrorAlert,
} from "./googleCalendarError";
import * as classes from "./GoogleCalendarDayWidget.styles";
import dayjs from "dayjs";

export interface GoogleCalendarDayConfig extends WidgetConfig {
  selectedCalendarIds: string[];
  maxEvents: number;
  daysAhead: number;
  transparentBackground: boolean;
}

interface EventFormData {
  title: string;
  calendarId: string;
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  eventId: string;
}

// ── Helpers ──

function roundToNext30(date: Date): string {
  const total = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.ceil(total / 30) * 30;
  const h = Math.floor(rounded / 60) % 24;
  const m = rounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatTimeRange(event: ParsedCalendarEvent): string {
  if (event.allDay) return "All day";
  const start = dayjs(event.start);
  const end = dayjs(event.end);
  if (start.format("A") === end.format("A")) {
    return `${start.format("h:mm")} – ${end.format("h:mm A")}`;
  }
  return `${start.format("h:mm A")} – ${end.format("h:mm A")}`;
}

function formatGroupHeader(dateStr: string): string {
  const today = dayjs().startOf("day");
  const date = dayjs(dateStr);
  const diff = date.diff(today, "day");
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return date.format("dddd");
  return date.format("ddd, MMM D");
}

function isToday(dateStr: string): boolean {
  return dayjs(dateStr).isSame(dayjs(), "day");
}

function getRelativeTime(event: ParsedCalendarEvent): { label: string; isNow: boolean } | null {
  if (event.allDay) return null;
  const now = dayjs();
  const start = dayjs(event.start);
  const end = dayjs(event.end);

  if (now.isAfter(start) && now.isBefore(end)) return { label: "Now", isNow: true };

  const diffMins = start.diff(now, "minute");
  if (diffMins <= 0 || diffMins > 120) return null;
  if (diffMins < 60) return { label: `in ${diffMins}m`, isNow: false };
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return { label: mins === 0 ? `in ${hours}h` : `in ${hours}h ${mins}m`, isNow: false };
}

function formDataToEventInput(data: EventFormData): CalendarEventInput {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (data.allDay) {
    const nextDay = dayjs(data.date).add(1, "day").format("YYYY-MM-DD");
    return {
      summary: data.title.trim(),
      ...(data.description ? { description: data.description } : {}),
      ...(data.location ? { location: data.location } : {}),
      start: { date: data.date },
      end: { date: nextDay },
    };
  }

  return {
    summary: data.title.trim(),
    ...(data.description ? { description: data.description } : {}),
    ...(data.location ? { location: data.location } : {}),
    start: { dateTime: `${data.date}T${data.startTime}:00`, timeZone },
    end: { dateTime: `${data.date}T${data.endTime}:00`, timeZone },
  };
}

// ── Main widget ──

export function GoogleCalendarDayWidget({ widget }: WidgetProps<GoogleCalendarDayConfig>) {
  const { selectedCalendarIds, maxEvents, daysAhead, transparentBackground } = widget.config;
  const { displayId, isPreview } = useGoogleRuntime();
  const isDisplayMode = !!displayId && !isPreview;
  const displayData = useDisplayCalendar({ displayId, selectedCalendarIds, daysAhead });
  const googleData = useGoogleCalendar({ selectedCalendarIds, daysAhead, enabled: !isDisplayMode });
  const {
    isAuthenticated,
    isLoading,
    error,
    calendars,
    events,
    lastUpdated,
    isStale,
    refresh,
    addEvent,
    editEvent,
    removeEvent,
  } = isDisplayMode ? displayData : googleData;

  const [detailEvent, setDetailEvent] = useState<ParsedCalendarEvent | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    calendarId: "",
    date: dayjs().format("YYYY-MM-DD"),
    allDay: false,
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    description: "",
    eventId: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const upcomingEvents = events.slice(0, maxEvents);

  const groupedEvents = useMemo(() => {
    const map = new Map<string, ParsedCalendarEvent[]>();
    for (const event of upcomingEvents) {
      const key = dayjs(event.start).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return Array.from(map.entries());
  }, [upcomingEvents]);

  const shouldShowErrorAlert = shouldShowGoogleCalendarErrorAlert(error, isDisplayMode);

  const calendarOptions = useMemo(
    () =>
      calendars.map((cal) => ({
        id: cal.id,
        label: cal.summary + (cal.primary ? " (Primary)" : ""),
        color: cal.backgroundColor ?? "#4285f4",
      })),
    [calendars],
  );

  const openCreateModal = useCallback(
    (date: Date) => {
      const start = roundToNext30(new Date());
      setFormData({
        title: "",
        calendarId: selectedCalendarIds[0] ?? calendars[0]?.id ?? "",
        date: dayjs(date).format("YYYY-MM-DD"),
        allDay: false,
        startTime: start,
        endTime: addMinutesToTime(start, 60),
        location: "",
        description: "",
        eventId: "",
      });
      setFormMode("create");
      setFormError(null);
      setFormOpen(true);
    },
    [selectedCalendarIds, calendars],
  );

  const openEditModal = useCallback((event: ParsedCalendarEvent) => {
    setDetailEvent(null);
    setDeleteConfirming(false);
    setDeleteError(null);
    setFormData({
      title: event.title === "(No title)" ? "" : event.title,
      calendarId: event.calendarId,
      date: dayjs(event.start).format("YYYY-MM-DD"),
      allDay: event.allDay,
      startTime: event.allDay ? "09:00" : dayjs(event.start).format("HH:mm"),
      endTime: event.allDay ? "10:00" : dayjs(event.end).format("HH:mm"),
      location: event.location ?? "",
      description: event.description ? event.description.replace(/<[^>]*>/g, "").trim() : "",
      eventId: event.id,
    });
    setFormMode("edit");
    setFormError(null);
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(async () => {
    if (!formData.title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!formData.calendarId) {
      setFormError("Please select a calendar");
      return;
    }
    if (!formData.allDay) {
      const startMins =
        parseInt(formData.startTime.split(":")[0]) * 60 +
        parseInt(formData.startTime.split(":")[1]);
      const endMins =
        parseInt(formData.endTime.split(":")[0]) * 60 + parseInt(formData.endTime.split(":")[1]);
      if (endMins <= startMins) {
        setFormError("End time must be after start time");
        return;
      }
    }

    setFormLoading(true);
    setFormError(null);
    try {
      const input = formDataToEventInput(formData);
      if (formMode === "create") {
        await addEvent(formData.calendarId, input);
      } else {
        await editEvent(formData.calendarId, formData.eventId, input);
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setFormLoading(false);
    }
  }, [formData, formMode, addEvent, editEvent]);

  const handleDelete = useCallback(async () => {
    if (!detailEvent) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await removeEvent(detailEvent.calendarId, detailEvent.id);
      setDetailEvent(null);
      setDeleteConfirming(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeleteLoading(false);
    }
  }, [detailEvent, removeEvent]);

  if (!isAuthenticated && !isDisplayMode) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <GoogleCalendarEmptyState variant="signIn" className={classes.empty} />
      </div>
    );
  }

  if (isDisplayMode && error && !isLoading && events.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <GoogleCalendarEmptyState
          variant="displayError"
          className={classes.empty}
          detail={displayCalendarEmptyDetail(error)}
        />
      </div>
    );
  }

  if (selectedCalendarIds.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <GoogleCalendarEmptyState variant="noCalendars" className={classes.empty} />
      </div>
    );
  }

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      <div className={classes.header}>
        <div className={classes.headerTitle}>
          <IconCalendarEvent size={13} />
          Upcoming
        </div>
        <HStack gap="xs">
          {isLoading && <Spinner size="sm" />}
          <IconButton
            icon={<IconPlus size={13} />}
            appearance="ghost"
            size="sm"
            onClick={() => openCreateModal(new Date())}
            className={classes.addBtn}
            aria-label="Add event"
          />
          <IconButton
            icon={<IconRefresh size={13} />}
            appearance="ghost"
            size="sm"
            aria-label="Refresh"
            onClick={refresh}
            className={classes.refreshBtn}
          />
        </HStack>
      </div>
      <WidgetDataStatus
        widgetId={widget.id}
        lastUpdated={lastUpdated}
        isStale={isStale}
        error={error}
        isLoading={isLoading}
      />

      {shouldShowErrorAlert && (
        <Alert tone="danger" appearance="subtle">
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      <ScrollArea className={classes.eventsList}>
        {groupedEvents.length > 0 ? (
          groupedEvents.map(([dateStr, dayEvents]) => (
            <div key={dateStr} className={classes.dayGroup}>
              <div className={classes.dayHeader}>
                <span
                  className={`${classes.dayHeaderLabel} ${isToday(dateStr) ? classes.dayHeaderToday : ""}`}
                >
                  {formatGroupHeader(dateStr)}
                </span>
                <div className={classes.dayHeaderLine} />
              </div>
              {dayEvents.map((event) => {
                const relTime = getRelativeTime(event);
                return (
                  <div
                    key={event.id}
                    className={`${classes.eventCard} ${relTime?.isNow ? classes.eventCardNow : ""}`}
                    onClick={() => {
                      setDeleteConfirming(false);
                      setDeleteError(null);
                      setDetailEvent(event);
                    }}
                  >
                    <div
                      className={classes.eventIndicator}
                      style={{ backgroundColor: event.color }}
                    />
                    <div className={classes.eventBody}>
                      <div className={classes.eventTitleRow}>
                        <span className={classes.eventTitle}>{event.title}</span>
                        {relTime && (
                          <span className={relTime.isNow ? classes.nowBadge : classes.soonBadge}>
                            {relTime.label}
                          </span>
                        )}
                      </div>
                      <div className={classes.eventMeta}>
                        <span className={classes.timeRange}>{formatTimeRange(event)}</span>
                        {event.calendarName && (
                          <span
                            className={classes.calendarBadge}
                            style={{ borderColor: event.color, color: event.color }}
                          >
                            {event.calendarName}
                          </span>
                        )}
                      </div>
                      {event.location && (
                        <div className={classes.eventLocation}>
                          <IconMapPin size={9} />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : isLoading ? (
          <div className={classes.loadingEvents}>
            <Spinner size="sm" />
            <Text size="sm" tone="secondary">
              Loading events...
            </Text>
          </div>
        ) : (
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            No upcoming events
          </Text>
        )}
      </ScrollArea>

      {/* ── Event detail modal ── */}
      <Dialog.Root
        open={!!detailEvent}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDetailEvent(null);
            setDeleteConfirming(false);
            setDeleteError(null);
          }
        }}
      >
        <Dialog.Popup>
          <Dialog.Title>{detailEvent?.title ?? "Event"}</Dialog.Title>
          {detailEvent && (
            <div className={classes.modalDetail}>
              <div className={classes.modalDetailRow}>
                <IconClock size={15} className={classes.modalDetailIcon} />
                <div>
                  <Text size="sm" weight="medium">
                    {formatGroupHeader(dayjs(detailEvent.start).format("YYYY-MM-DD"))}
                  </Text>
                  <Text size="sm" tone="secondary">
                    {formatTimeRange(detailEvent)}
                  </Text>
                </div>
              </div>

              {detailEvent.location && (
                <div className={classes.modalDetailRow}>
                  <IconMapPin size={15} className={classes.modalDetailIcon} />
                  <Text size="sm">{detailEvent.location}</Text>
                </div>
              )}

              {detailEvent.calendarName && (
                <div className={classes.modalDetailRow}>
                  <IconCalendar size={15} className={classes.modalDetailIcon} />
                  <Text size="sm">{detailEvent.calendarName}</Text>
                </div>
              )}

              {detailEvent.description && (
                <div className={classes.modalDetailRow}>
                  <IconFileText size={15} className={classes.modalDetailIcon} />
                  <Text size="sm" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {detailEvent.description.replace(/<[^>]*>/g, "").trim()}
                  </Text>
                </div>
              )}

              <Divider />

              {deleteConfirming ? (
                <div className={classes.deleteConfirmRow}>
                  <Text size="sm" tone="secondary">
                    Delete this event?
                  </Text>
                  <HStack gap="xs" justify="end">
                    <Button
                      appearance="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteConfirming(false);
                        setDeleteError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button tone="danger" size="sm" loading={deleteLoading} onClick={handleDelete}>
                      Delete
                    </Button>
                  </HStack>
                  {deleteError && (
                    <Text size="sm" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
                      {deleteError}
                    </Text>
                  )}
                </div>
              ) : (
                <HStack gap="xs" justify="between">
                  <Button
                    appearance="ghost"
                    tone="danger"
                    size="sm"
                    onClick={() => setDeleteConfirming(true)}
                  >
                    Delete
                  </Button>
                  <Button appearance="subtle" size="sm" onClick={() => openEditModal(detailEvent)}>
                    Edit
                  </Button>
                </HStack>
              )}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Root>

      {/* ── Create / Edit event modal ── */}
      <Dialog.Root
        open={formOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setFormOpen(false);
        }}
      >
        <Dialog.Popup>
          <Dialog.Title>{formMode === "create" ? "New Event" : "Edit Event"}</Dialog.Title>
          <Stack gap="sm">
            <TextField
              label="Title"
              placeholder="Event title"
              required
              value={formData.title}
              onValueChange={(value) => setFormData((d) => ({ ...d, title: value }))}
              autoFocus={formMode === "create"}
            />

            <Select.Root
              value={formData.calendarId || null}
              onValueChange={(v) =>
                setFormData((d) => ({ ...d, calendarId: v == null ? "" : String(v) }))
              }
              required
            >
              <Select.Label>Calendar</Select.Label>
              <Select.Trigger placeholder="Select a calendar">
                <Select.Value>
                  {({ defaultChildren, isPlaceholder }) => {
                    if (isPlaceholder) return "Select a calendar";
                    const selected = calendarOptions.find((c) => c.id === formData.calendarId);
                    return (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          aria-hidden
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: selected?.color ?? "#4285f4",
                            flexShrink: 0,
                          }}
                        />
                        {selected?.label ?? defaultChildren}
                      </span>
                    );
                  }}
                </Select.Value>
              </Select.Trigger>
              <Select.Popover>
                <Select.ListBox>
                  {calendarOptions.map((cal) => (
                    <Select.Item key={cal.id} value={cal.id} textValue={cal.label}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          aria-hidden
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: cal.color,
                            flexShrink: 0,
                          }}
                        />
                        {cal.label}
                      </span>
                    </Select.Item>
                  ))}
                </Select.ListBox>
              </Select.Popover>
            </Select.Root>

            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onValueChange={(value) => setFormData((d) => ({ ...d, date: value }))}
            />

            <HStack justify="between">
              <Text size="sm">All day</Text>
              <Switch
                checked={formData.allDay}
                onCheckedChange={(value) => setFormData((d) => ({ ...d, allDay: value }))}
              />
            </HStack>

            {!formData.allDay && (
              <div className={classes.timeGrid}>
                <TextField
                  label="Start time"
                  type="time"
                  value={formData.startTime}
                  onValueChange={(value) => setFormData((d) => ({ ...d, startTime: value }))}
                />
                <TextField
                  label="End time"
                  type="time"
                  value={formData.endTime}
                  onValueChange={(value) => setFormData((d) => ({ ...d, endTime: value }))}
                />
              </div>
            )}

            <TextField
              label="Location"
              placeholder="Optional"
              value={formData.location}
              onValueChange={(value) => setFormData((d) => ({ ...d, location: value }))}
            />

            <TextAreaField
              label="Description"
              placeholder="Optional"
              value={formData.description}
              onValueChange={(value) => setFormData((d) => ({ ...d, description: value }))}
            />

            {formError && (
              <Alert tone="danger" appearance="subtle">
                <Text size="sm">{formError}</Text>
              </Alert>
            )}

            <HStack justify="end" gap="xs">
              <Button appearance="ghost" size="sm" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" loading={formLoading} onClick={handleFormSubmit}>
                {formMode === "create" ? "Create Event" : "Save Changes"}
              </Button>
            </HStack>
          </Stack>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}

// ── Settings ──

export function GoogleCalendarDayWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<GoogleCalendarDayConfig>) {
  const { selectedCalendarIds, maxEvents, daysAhead } = widget.config;
  const { isAuthenticated, isLoading, signIn } = useGoogleRuntime();
  const { calendars } = useGoogleCalendar({ selectedCalendarIds, daysAhead });

  const calendarOptions = calendars.map((cal) => ({
    id: cal.id,
    label: cal.summary + (cal.primary ? " (Primary)" : ""),
  }));

  return (
    <Stack gap="md">
      <Surface padding="sm" className={classes.authSection}>
        {isAuthenticated ? (
          <>
            <Badge tone="success" appearance="subtle">
              Connected to Google
            </Badge>
            <MultiSelector
              label="Select Calendars"
              placeholder="Choose calendars to display..."
              options={calendarOptions.map((cal) => ({ value: cal.id, label: cal.label }))}
              value={selectedCalendarIds}
              onValueChange={(value) => onConfigChange({ selectedCalendarIds: value })}
            />
          </>
        ) : (
          <Stack align="center" gap="sm">
            <Text size="sm" tone="secondary">
              Sign in to select your calendars
            </Text>
            <Button onClick={signIn} loading={isLoading} size="sm">
              Sign in with Google
            </Button>
          </Stack>
        )}
      </Surface>

      <NumberInput
        label="Maximum Events to Show"
        min={1}
        max={30}
        value={maxEvents}
        onValueChange={(value) => onConfigChange({ maxEvents: Number(value) || 10 })}
      />

      <NumberInput
        label="Days Ahead"
        description="How many days ahead to fetch events"
        min={1}
        max={90}
        value={daysAhead}
        onValueChange={(value) => onConfigChange({ daysAhead: Number(value) || 30 })}
      />
    </Stack>
  );
}

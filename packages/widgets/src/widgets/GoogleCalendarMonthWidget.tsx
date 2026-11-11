import { useState, useMemo, useCallback } from "react";
import {
  Text,
  HStack,
  Spinner,
  IconButton,
  ScrollArea,
  Stack,
  Surface,
  Badge,
  MultiSelector,
  Button,
  NumberInput,
  Dialog,
  TextField,
  TextAreaField,
  Select,
  Switch,
  Alert,
  Calendar,
} from "@var-ui/react";
import { IconCalendarEvent, IconRefresh, IconMapPin, IconPlus } from "@tabler/icons-react";
import { GoogleCalendarEmptyState } from "../chrome/GoogleCalendarEmptyState";
import { displayCalendarEmptyDetail } from "./googleCalendarError";
import type { WidgetProps, WidgetConfig } from "../types";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { useDisplayCalendar } from "../hooks/useDisplayCalendar";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useGoogleRuntime } from "../googleRuntime";
import type { ParsedCalendarEvent, CalendarEventInput } from "../services/googleCalendar";
import { calendarDateFromIso, isoFromCalendarDate } from "../dateValue";
import * as classes from "./GoogleCalendarMonthWidget.styles";
import dayjs from "dayjs";

export interface GoogleCalendarMonthConfig extends WidgetConfig {
  selectedCalendarIds: string[];
  daysAhead: number;
  transparentBackground: boolean;
}

// ── Helpers (shared with DayWidget pattern) ──

interface EventFormData {
  title: string;
  calendarId: string;
  date: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
}

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

function formatTimeRange(event: ParsedCalendarEvent): string {
  if (event.allDay) return "All day";
  const start = dayjs(event.start);
  const end = dayjs(event.end);
  if (start.format("A") === end.format("A")) {
    return `${start.format("h:mm")} – ${end.format("h:mm A")}`;
  }
  return `${start.format("h:mm A")} – ${end.format("h:mm A")}`;
}

// ── Main widget ──

export function GoogleCalendarMonthWidget({ widget }: WidgetProps<GoogleCalendarMonthConfig>) {
  const { selectedCalendarIds, daysAhead, transparentBackground } = widget.config;
  const { displayId, isPreview, isAuthenticated } = useGoogleRuntime();
  const isDisplayMode = !!displayId && !isPreview;
  const displayData = useDisplayCalendar({ displayId, selectedCalendarIds, daysAhead });
  const googleData = useGoogleCalendar({ selectedCalendarIds, daysAhead, enabled: !isDisplayMode });
  const { isLoading, events, calendars, lastUpdated, isStale, error, refresh, addEvent } =
    isDisplayMode ? displayData : googleData;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ── Create event form state ──
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    calendarId: "",
    date: dayjs().format("YYYY-MM-DD"),
    allDay: false,
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    description: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      });
      setFormError(null);
      setFormOpen(true);
    },
    [selectedCalendarIds, calendars],
  );

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
      await addEvent(formData.calendarId, input);
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setFormLoading(false);
    }
  }, [formData, addEvent]);

  // ── Event map ──

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ParsedCalendarEvent[]>();
    for (const event of events) {
      const key = dayjs(event.start).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const selectedDateStr = dayjs(selectedDate).format("YYYY-MM-DD");
  const selectedDateEvents = eventsByDate.get(selectedDateStr) ?? [];

  const selectedLabel = (() => {
    const diff = dayjs(selectedDate).diff(dayjs().startOf("day"), "day");
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return dayjs(selectedDate).format("ddd, MMM D");
  })();

  if (!isAuthenticated && !isDisplayMode) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <GoogleCalendarEmptyState variant="signIn" className={classes.empty} />
      </div>
    );
  }

  if (isDisplayMode && displayData.error && !displayData.isLoading && events.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <GoogleCalendarEmptyState
          variant="displayError"
          className={classes.empty}
          detail={displayCalendarEmptyDetail(displayData.error)}
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
        <span className={classes.title}>
          <IconCalendarEvent size={12} />
          Calendar
        </span>
        <HStack gap="xs">
          {isLoading && <Spinner size="sm" />}
          <IconButton
            icon={<IconPlus size={13} />}
            appearance="ghost"
            size="sm"
            onClick={() => openCreateModal(selectedDate)}
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

      <div className={classes.calendarWrap}>
        <Calendar
          aria-label="Month calendar"
          className={classes.calendar}
          value={calendarDateFromIso(dayjs(selectedDate).format("YYYY-MM-DD"))}
          onValueChange={(d) => {
            const iso = isoFromCalendarDate(d);
            if (iso) setSelectedDate(dayjs(iso).toDate());
          }}
        />
      </div>

      <div className={classes.dayPanel}>
        <div className={classes.dayPanelHeader}>
          <span className={classes.dayPanelTitle}>{selectedLabel}</span>
          {selectedDateEvents.length > 0 && (
            <span className={classes.eventCount}>{selectedDateEvents.length}</span>
          )}
          <IconButton
            icon={<IconPlus size={12} />}
            appearance="ghost"
            size="sm"
            onClick={() => openCreateModal(selectedDate)}
            className={classes.addBtn}
            aria-label="Add event"
            style={{ marginLeft: "auto" }}
          />
        </div>
        {selectedDateEvents.length === 0 ? (
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            No events
          </Text>
        ) : (
          <ScrollArea className={classes.dayEventsList}>
            {selectedDateEvents.map((event) => (
              <div key={event.id} className={classes.eventCard}>
                <div className={classes.eventIndicator} style={{ backgroundColor: event.color }} />
                <div className={classes.eventBody}>
                  <div className={classes.eventTitle}>{event.title}</div>
                  <div className={classes.eventTime}>{formatTimeRange(event)}</div>
                  {event.location && (
                    <div className={classes.eventLocation}>
                      <IconMapPin size={9} />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
      </div>

      {/* ── Create event modal ── */}
      <Dialog.Root
        open={formOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setFormOpen(false);
        }}
      >
        <Dialog.Popup>
          <Dialog.Title>New Event</Dialog.Title>
          <Stack gap="sm">
            <TextField
              label="Title"
              placeholder="Event title"
              required
              value={formData.title}
              onValueChange={(value) => setFormData((d) => ({ ...d, title: value }))}
              autoFocus
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
                Create Event
              </Button>
            </HStack>
          </Stack>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}

// ── Settings ──

export function GoogleCalendarMonthWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<GoogleCalendarMonthConfig>) {
  const { selectedCalendarIds, daysAhead } = widget.config;
  const { isAuthenticated, isLoading: authLoading, signIn } = useGoogleRuntime();
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
            <Button onClick={signIn} loading={authLoading} size="sm">
              Sign in with Google
            </Button>
          </Stack>
        )}
      </Surface>

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

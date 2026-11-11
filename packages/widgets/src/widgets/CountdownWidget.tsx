import { useEffect, useState } from "react";
import {
  DateInput,
  DateTimeInput,
  HStack,
  Select,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import type { CalendarDate, CalendarDateTime } from "@internationalized/date";
import type { TextAlign, WidgetConfig, WidgetProps } from "../types";
import {
  calendarDateFromIso,
  dateTimeFromLocalInput,
  isoFromCalendarDate,
  localInputFromDateTime,
} from "../dateValue";

import { countdownRemaining, formatCountdownParts } from "./countdown";
import * as classes from "./listWidget.styles";

export interface CountdownConfig extends WidgetConfig {
  target: string;
  allDay: boolean;
  label: string;
  showSeconds: boolean;
  transparentBackground: boolean;
  textAlign: TextAlign;
}

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export function CountdownWidget({ widget }: WidgetProps<CountdownConfig>) {
  const {
    target = "",
    allDay = true,
    label = "",
    showSeconds = false,
    transparentBackground,
    textAlign = "center",
  } = widget.config;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), showSeconds ? 1000 : 60_000);
    return () => window.clearInterval(interval);
  }, [showSeconds]);

  const remaining = countdownRemaining(now, target, allDay);
  const title =
    label.trim() || (remaining.kind === "past" ? remaining.dateLabel : target) || "Countdown";

  return (
    <div
      className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}
      style={{ textAlign }}
    >
      {remaining.kind === "invalid" ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            Pick a date in settings.
          </Text>
        </div>
      ) : (
        <>
          <Text size="sm" tone="secondary">
            {title}
          </Text>
          {remaining.kind === "past" ? (
            <Text className={classes.countdownValue} style={{ fontSize: "1.4rem" }}>
              It happened
            </Text>
          ) : (
            <Text className={classes.countdownValue} style={{ fontSize: "1.8rem" }}>
              {formatCountdownParts(remaining.parts, showSeconds)}
            </Text>
          )}
          {remaining.kind === "past" && (
            <Text size="sm" tone="secondary">
              {remaining.dateLabel}
            </Text>
          )}
        </>
      )}
    </div>
  );
}

export function CountdownWidgetSettings({ widget, onConfigChange }: WidgetProps<CountdownConfig>) {
  const {
    target = "",
    allDay = true,
    label = "",
    showSeconds = false,
    transparentBackground,
    textAlign = "center",
  } = widget.config;

  return (
    <Stack gap="md">
      <TextField
        label="Label"
        value={label}
        onValueChange={(value) => onConfigChange({ label: value })}
      />
      {allDay ? (
        <DateInput
          label="Date"
          value={calendarDateFromIso(target)}
          onValueChange={(value) =>
            onConfigChange({ target: isoFromCalendarDate(value as CalendarDate | null) })
          }
        />
      ) : (
        <DateTimeInput
          label="Date and time"
          value={dateTimeFromLocalInput(target)}
          onValueChange={(value) =>
            onConfigChange({
              target: localInputFromDateTime(value as CalendarDateTime | null) ?? "",
            })
          }
        />
      )}
      <HStack justify="between">
        <Text size="sm">All-day</Text>
        <Switch
          aria-label="All-day"
          checked={allDay}
          onCheckedChange={(value) => onConfigChange({ allDay: value })}
        />
      </HStack>
      <HStack justify="between">
        <Text size="sm">Show seconds</Text>
        <Switch
          aria-label="Show seconds"
          checked={showSeconds}
          onCheckedChange={(value) => onConfigChange({ showSeconds: value })}
        />
      </HStack>
      <Select
        label="Text align"
        options={ALIGN_OPTIONS}
        value={textAlign}
        onValueChange={(key) => {
          if (key === "left" || key === "center" || key === "right") {
            onConfigChange({ textAlign: key });
          }
        }}
      />
      <HStack justify="between">
        <Text size="sm">Transparent background</Text>
        <Switch
          aria-label="Transparent background"
          checked={transparentBackground}
          onCheckedChange={(value) => onConfigChange({ transparentBackground: value })}
        />
      </HStack>
    </Stack>
  );
}

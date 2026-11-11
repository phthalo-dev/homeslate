import { DateTimeInput, HStack, Select, Stack, Switch, Text, TextAreaField } from "@var-ui/react";
import type { CalendarDateTime } from "@internationalized/date";
import type { TextAlign, WidgetConfig, WidgetProps } from "../types";
import { dateTimeFromLocalInput, localInputFromDateTime } from "../dateValue";
import { isAnnouncementVisible } from "./announcement";
import * as classes from "./listWidget.styles";

export interface AnnouncementConfig extends WidgetConfig {
  body: string;
  textAlign: TextAlign;
  size: "md" | "lg" | "xl";
  showFrom?: string;
  showUntil?: string;
  transparentBackground: boolean;
}

const SIZE_OPTIONS = [
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" },
];

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export function AnnouncementWidget({ widget, isEditing }: WidgetProps<AnnouncementConfig>) {
  const {
    body = "",
    textAlign = "left",
    size = "lg",
    showFrom,
    showUntil,
    transparentBackground,
  } = widget.config;
  const visible = isAnnouncementVisible(new Date(), showFrom, showUntil);
  const sizeClass =
    size === "xl" ? classes.sizeXl : size === "md" ? classes.sizeMd : classes.sizeLg;

  if (!isEditing && (!body.trim() || !visible)) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`} />
    );
  }

  return (
    <div
      className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}
      style={{ textAlign }}
    >
      {!body.trim() ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            Write the announcement.
          </Text>
        </div>
      ) : (
        <>
          {!visible && (
            <Text size="xs" tone="secondary">
              Hidden on kiosk {showFrom && new Date() < new Date(showFrom) ? "until" : "after"} the
              scheduled window.
            </Text>
          )}
          <div className={`${classes.announcement} ${sizeClass}`}>{body}</div>
        </>
      )}
    </div>
  );
}

export function AnnouncementWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<AnnouncementConfig>) {
  const {
    body = "",
    textAlign = "left",
    size = "lg",
    showFrom = "",
    showUntil = "",
    transparentBackground,
  } = widget.config;

  return (
    <Stack gap="md">
      <TextAreaField
        label="Announcement"
        value={body}
        onValueChange={(value) => onConfigChange({ body: value })}
      />
      <Select
        label="Size"
        options={SIZE_OPTIONS}
        value={size}
        onValueChange={(key) => {
          if (key === "md" || key === "lg" || key === "xl") {
            onConfigChange({ size: key });
          }
        }}
      />
      <Select
        label="Align"
        options={ALIGN_OPTIONS}
        value={textAlign}
        onValueChange={(key) => {
          if (key === "left" || key === "center" || key === "right") {
            onConfigChange({ textAlign: key });
          }
        }}
      />
      <DateTimeInput
        label="Show from"
        value={dateTimeFromLocalInput(showFrom)}
        onValueChange={(value) =>
          onConfigChange({
            showFrom: localInputFromDateTime(value as CalendarDateTime | null),
          })
        }
      />
      <DateTimeInput
        label="Show until"
        value={dateTimeFromLocalInput(showUntil)}
        onValueChange={(value) =>
          onConfigChange({
            showUntil: localInputFromDateTime(value as CalendarDateTime | null),
          })
        }
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

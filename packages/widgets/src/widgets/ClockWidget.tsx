import { useState, useEffect, useRef, useCallback } from "react";
import { HStack, Select, Stack, Switch, Text } from "@var-ui/react";
import type { WidgetProps, WidgetConfig, TextAlign } from "../types";
import { useOverlayPortalContainer } from "../overlayPortal";
import { clock } from "./ClockWidget.styles";

export interface ClockConfig extends WidgetConfig {
  showSeconds: boolean;
  showDate: boolean;
  use24Hour: boolean;
  timezone: string;
  transparentBackground: boolean;
  textAlign: TextAlign;
}

const TIMEZONE_OPTIONS = [
  { id: "local", label: "Local Time" },
  { id: "America/New_York", label: "Eastern Time" },
  { id: "America/Chicago", label: "Central Time" },
  { id: "America/Denver", label: "Mountain Time" },
  { id: "America/Los_Angeles", label: "Pacific Time" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Paris", label: "Paris" },
  { id: "Asia/Tokyo", label: "Tokyo" },
];

const ALIGN_OPTIONS = [
  { id: "left", label: "Left" },
  { id: "center", label: "Center" },
  { id: "right", label: "Right" },
];

export function ClockWidget({ widget }: WidgetProps<ClockConfig>) {
  const [time, setTime] = useState(new Date());
  const [fontSize, setFontSize] = useState(24);
  const [dateSize, setDateSize] = useState(12);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    showSeconds,
    showDate,
    use24Hour,
    timezone,
    transparentBackground,
    textAlign = "center",
  } = widget.config;

  const updateSizes = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const base = Math.min(width, height);
    setFontSize(Math.max(24, Math.min(160, base * 0.24)));
    setDateSize(Math.max(10, Math.min(48, base * 0.07)));
  }, []);

  useEffect(() => {
    updateSizes();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateSizes);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateSizes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !use24Hour,
      ...(timezone !== "local" && { timeZone: timezone }),
    };

    if (showSeconds) {
      options.second = "2-digit";
    }

    return time.toLocaleTimeString(undefined, options);
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
      ...(timezone !== "local" && { timeZone: timezone }),
    };
    return time.toLocaleDateString(undefined, options);
  };

  const alignMap = { left: "start", center: "center", right: "end" } as const;
  const align = alignMap[textAlign];

  return (
    <div
      ref={containerRef}
      className={clock({ transparent: transparentBackground }).root.className}
    >
      <Stack
        gap="none"
        align={align}
        justify="center"
        style={{ textAlign, width: "100%", height: "100%" }}
      >
        <Text className={clock().time.className} style={{ fontSize: `${fontSize}px` }}>
          {formatTime()}
        </Text>
        {showDate && (
          <Text className={clock().date.className} style={{ fontSize: `${dateSize}px` }}>
            {formatDate()}
          </Text>
        )}
      </Stack>
    </div>
  );
}

export function ClockWidgetSettings({ widget, onConfigChange }: WidgetProps<ClockConfig>) {
  const { showSeconds, showDate, use24Hour, timezone, textAlign = "center" } = widget.config;
  const portalContainer = useOverlayPortalContainer();

  return (
    <Stack gap="md">
      <HStack justify="between">
        <Text size="sm">Show Seconds</Text>
        <Switch
          aria-label="Show Seconds"
          isSelected={showSeconds}
          onChange={(value) => onConfigChange({ showSeconds: value })}
        />
      </HStack>
      <HStack justify="between">
        <Text size="sm">Show Date</Text>
        <Switch
          aria-label="Show Date"
          isSelected={showDate}
          onChange={(value) => onConfigChange({ showDate: value })}
        />
      </HStack>
      <HStack justify="between">
        <Text size="sm">24-Hour Format</Text>
        <Switch
          aria-label="24-Hour Format"
          isSelected={use24Hour}
          onChange={(value) => onConfigChange({ use24Hour: value })}
        />
      </HStack>
      <Select
        label="Timezone"
        options={TIMEZONE_OPTIONS}
        selectedKey={timezone}
        onSelectionChange={(key) => onConfigChange({ timezone: String(key ?? "local") })}
        portalContainer={portalContainer}
      />
      <Select
        label="Text Alignment"
        options={ALIGN_OPTIONS}
        selectedKey={textAlign}
        onSelectionChange={(key) => {
          if (key === "left" || key === "center" || key === "right") {
            onConfigChange({ textAlign: key });
          }
        }}
        portalContainer={portalContainer}
      />
    </Stack>
  );
}

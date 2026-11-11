import { useEffect, useState } from "react";
import { NumberInput, Select, Stack, Switch, Text, TextField } from "@var-ui/react";
import { IconAppWindow } from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import {
  EMBED_EMPTY_COPY,
  EMBED_INVALID_COPY,
  embedIframeKey,
  embedSandbox,
  parseEmbedUrl,
} from "./embedUrl";
import * as classes from "./EmbedWidget.styles";

const REFRESH_PRESETS = new Set([0, 60, 300, 900]);

const REFRESH_OPTIONS = [
  { value: "0", label: "Off" },
  { value: "60", label: "1 minute" },
  { value: "300", label: "5 minutes" },
  { value: "900", label: "15 minutes" },
  { value: "custom", label: "Custom" },
];

export interface EmbedConfig extends WidgetConfig {
  url: string;
  refreshSeconds: number;
  allowInteraction: boolean;
  transparentBackground: boolean;
}

function clampRefreshSeconds(refreshSeconds: number | undefined): number {
  return Math.min(3600, Math.max(0, refreshSeconds ?? 0));
}

export function EmbedWidget({ widget }: WidgetProps<EmbedConfig>) {
  const {
    url = "",
    refreshSeconds,
    allowInteraction = false,
    transparentBackground,
  } = widget.config;
  const [frameKey, setFrameKey] = useState(0);
  const clampedRefresh = clampRefreshSeconds(refreshSeconds);
  const trimmed = url.trim();
  const parsed = trimmed ? parseEmbedUrl(trimmed) : { ok: false as const };
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  useEffect(() => {
    if (clampedRefresh <= 0) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const start = () => {
      stop();
      intervalId = setInterval(() => {
        if (document.visibilityState === "visible") {
          setFrameKey((key) => key + 1);
        }
      }, clampedRefresh * 1000);
    };

    const sync = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [clampedRefresh]);

  if (!trimmed) {
    return (
      <div className={`${containerClass} ${classes.padded}`}>
        <div className={classes.empty}>
          <IconAppWindow size={48} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            {EMBED_EMPTY_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (!parsed.ok) {
    return (
      <div className={`${containerClass} ${classes.padded}`}>
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            {EMBED_INVALID_COPY}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <iframe
        key={embedIframeKey(frameKey, allowInteraction, parsed.href)}
        className={`${classes.frame} ${allowInteraction ? "" : classes.noPointer}`}
        src={parsed.href}
        sandbox={embedSandbox(allowInteraction)}
        referrerPolicy="no-referrer"
        title="Embedded page"
      />
    </div>
  );
}

export function EmbedWidgetSettings({ widget, onConfigChange }: WidgetProps<EmbedConfig>) {
  const {
    url = "",
    refreshSeconds,
    allowInteraction = false,
    transparentBackground,
  } = widget.config;
  const clampedRefresh = clampRefreshSeconds(refreshSeconds);
  const [customMode, setCustomMode] = useState(
    clampedRefresh > 0 && !REFRESH_PRESETS.has(clampedRefresh),
  );
  const selectValue =
    customMode || !REFRESH_PRESETS.has(clampedRefresh) ? "custom" : String(clampedRefresh);

  return (
    <Stack gap="md">
      <TextField
        label="URL"
        placeholder="https://"
        value={url}
        onValueChange={(value) => onConfigChange({ url: value })}
      />

      <Select
        label="Refresh"
        options={REFRESH_OPTIONS}
        value={selectValue}
        onValueChange={(key) => {
          const value = key == null ? "0" : String(key);
          if (value === "custom") {
            setCustomMode(true);
            if (REFRESH_PRESETS.has(clampedRefresh)) {
              onConfigChange({ refreshSeconds: clampedRefresh === 0 ? 60 : clampedRefresh });
            }
          } else {
            setCustomMode(false);
            onConfigChange({ refreshSeconds: Number(value) });
          }
        }}
      />

      {selectValue === "custom" && (
        <NumberInput
          label="Refresh seconds"
          min={1}
          max={3600}
          value={Math.min(3600, Math.max(1, clampedRefresh || 1))}
          onValueChange={(value) =>
            onConfigChange({
              refreshSeconds:
                typeof value === "number" && Number.isFinite(value)
                  ? Math.min(3600, Math.max(1, value))
                  : 1,
            })
          }
        />
      )}

      <Switch
        checked={allowInteraction}
        onCheckedChange={(value) => onConfigChange({ allowInteraction: value })}
      >
        Allow interaction
      </Switch>
      <Text size="xs" tone="secondary">
        Home Assistant and other interactive apps need this. The embedded origin can run JavaScript.
      </Text>

      <Switch
        checked={transparentBackground}
        onCheckedChange={(value) => onConfigChange({ transparentBackground: value })}
      >
        Transparent background
      </Switch>

      <Text size="xs" tone="secondary">
        If the frame is blank, the other site may send X-Frame-Options or CSP frame-ancestors. That
        is their policy, not a Homeslate bug.
      </Text>
    </Stack>
  );
}

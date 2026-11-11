import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconButton,
  Button,
  HStack,
  NumberInput,
  Surface,
  Select,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import { IconPlayerPause, IconPlayerPlay, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import type { AlarmToneId } from "@homeslate/schema";
import { ALARM_TONE_OPTIONS } from "../alarms/tones";
import { useTimers } from "../timers/TimersContext";
import { formatDurationMs, remainingMs } from "../timers/format";
import type { TimerPreset, TimersWidgetConfig } from "../timers/types";
import type { WidgetConfig, WidgetProps } from "../types";
import * as classes from "./TimersWidget.styles";

export interface TimersConfig extends TimersWidgetConfig, WidgetConfig {
  presets: TimerPreset[];
  transparentBackground: boolean;
}

const TONE_IDS = new Set<AlarmToneId>(ALARM_TONE_OPTIONS.map((tone) => tone.value));

const TONE_SELECT_OPTIONS = ALARM_TONE_OPTIONS.map((tone) => ({
  value: tone.value,
  label: tone.label,
}));

export function coerceTimerPresets(value: unknown): TimerPreset[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((preset): TimerPreset[] => {
    if (
      typeof preset === "object" &&
      preset !== null &&
      typeof preset.id === "string" &&
      preset.id.length > 0 &&
      typeof preset.label === "string" &&
      typeof preset.durationSeconds === "number" &&
      Number.isFinite(preset.durationSeconds) &&
      preset.durationSeconds > 0
    ) {
      return [
        {
          id: preset.id,
          label: preset.label,
          durationSeconds: preset.durationSeconds,
          toneId:
            typeof preset.toneId === "string" && TONE_IDS.has(preset.toneId as AlarmToneId)
              ? (preset.toneId as AlarmToneId)
              : "chime",
        },
      ];
    }
    return [];
  });
}

function createTimerPreset(): TimerPreset {
  return {
    id: uuidv4(),
    label: "Timer",
    durationSeconds: 300,
    toneId: "chime",
  };
}

export function TimersWidget({ widget, onConfigChange }: WidgetProps<TimersConfig>) {
  const { runtimes, startFromPreset, pause, resume, cancel } = useTimers();
  const [now, setNow] = useState(() => Date.now());
  const presets = useMemo(() => coerceTimerPresets(widget.config.presets), [widget.config.presets]);
  const transparentBackground = widget.config.transparentBackground ?? false;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const updatePreset = useCallback(
    (id: string, patch: Partial<TimerPreset>) => {
      onConfigChange({
        presets: presets.map((preset) => (preset.id === id ? { ...preset, ...patch } : preset)),
      });
    },
    [onConfigChange, presets],
  );

  const updateDuration = useCallback(
    (id: string, field: "minutes" | "seconds", value: number | string) => {
      const preset = presets.find((entry) => entry.id === id);
      if (!preset || typeof value !== "number") return;
      const minutes = Math.floor(preset.durationSeconds / 60);
      const seconds = preset.durationSeconds % 60;
      const nextDuration = field === "minutes" ? value * 60 + seconds : minutes * 60 + value;
      updatePreset(id, { durationSeconds: Math.max(1, Math.round(nextDuration)) });
    },
    [presets, updatePreset],
  );

  const addPreset = useCallback(() => {
    onConfigChange({ presets: [...presets, createTimerPreset()] });
  }, [onConfigChange, presets]);

  const deletePreset = useCallback(
    (id: string) => {
      onConfigChange({ presets: presets.filter((preset) => preset.id !== id) });
    },
    [onConfigChange, presets],
  );

  const noTimers = runtimes.length === 0 && presets.length === 0;

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {noTimers ? (
        <Stack className={classes.empty} gap="sm">
          <Text size="sm" tone="secondary">
            Add a timer to get started
          </Text>
          <Button onClick={addPreset} className={classes.touchButton}>
            <IconPlus size={18} />
            Add timer
          </Button>
        </Stack>
      ) : (
        <Stack gap="sm" className={classes.list}>
          {runtimes.length > 0 && (
            <Stack gap="xs">
              <Text
                size="xs"
                weight="semibold"
                tone="secondary"
                style={{ textTransform: "uppercase" }}
              >
                Active timers
              </Text>
              {runtimes.map((runtime) => (
                <Surface key={runtime.id} padding="sm" className={classes.runtimeCard}>
                  <HStack justify="between" gap="xs">
                    <Stack gap="none" className={classes.runtimeDetails}>
                      <Text weight="semibold" lineClamp={1}>
                        {runtime.label || "Timer"}
                      </Text>
                      <Text
                        className={classes.countdown}
                        aria-label={`${runtime.label || "Timer"} remaining`}
                      >
                        {formatDurationMs(remainingMs(runtime, now))}
                      </Text>
                    </Stack>
                    <HStack gap="xs">
                      <IconButton
                        icon={
                          runtime.status === "running" ? (
                            <IconPlayerPause size={20} />
                          ) : (
                            <IconPlayerPlay size={20} />
                          )
                        }
                        size="lg"
                        appearance="subtle"
                        onClick={() =>
                          runtime.status === "running" ? pause(runtime.id) : resume(runtime.id)
                        }
                        aria-label={
                          runtime.status === "running"
                            ? `Pause ${runtime.label || "Timer"}`
                            : `Resume ${runtime.label || "Timer"}`
                        }
                        className={classes.touchAction}
                      />
                      <IconButton
                        icon={<IconX size={20} />}
                        size="lg"
                        appearance="subtle"
                        tone="danger"
                        onClick={() => cancel(runtime.id)}
                        aria-label={`Cancel ${runtime.label || "Timer"}`}
                        className={classes.touchAction}
                      />
                    </HStack>
                  </HStack>
                </Surface>
              ))}
            </Stack>
          )}

          <Stack gap="xs">
            <HStack justify="between">
              <Text
                size="xs"
                weight="semibold"
                tone="secondary"
                style={{ textTransform: "uppercase" }}
              >
                Presets
              </Text>
              <IconButton
                icon={<IconPlus size={20} />}
                appearance="subtle"
                size="lg"
                onClick={addPreset}
                aria-label="Add timer"
                className={classes.touchAction}
              />
            </HStack>
            {presets.map((preset) => {
              const minutes = Math.floor(preset.durationSeconds / 60);
              const seconds = preset.durationSeconds % 60;
              return (
                <Surface key={preset.id} padding="sm">
                  <Stack gap="xs">
                    <HStack gap="xs">
                      <TextField
                        value={preset.label}
                        onValueChange={(value) => updatePreset(preset.id, { label: value })}
                        aria-label="Timer label"
                        size="sm"
                        className={classes.labelInput}
                      />
                      <IconButton
                        icon={<IconTrash size={18} />}
                        appearance="ghost"
                        tone="danger"
                        size="lg"
                        onClick={() => deletePreset(preset.id)}
                        aria-label={`Delete ${preset.label || "Timer"}`}
                        className={classes.touchAction}
                      />
                    </HStack>
                    <HStack gap="xs">
                      <NumberInput
                        value={minutes}
                        onValueChange={(value) => updateDuration(preset.id, "minutes", value)}
                        min={0}
                        aria-label="Timer minutes"
                        label="min"
                      />
                      <NumberInput
                        value={seconds}
                        onValueChange={(value) => updateDuration(preset.id, "seconds", value)}
                        min={0}
                        max={59}
                        aria-label="Timer seconds"
                        label="sec"
                      />
                      <Select
                        aria-label="Timer tone"
                        options={TONE_SELECT_OPTIONS}
                        value={preset.toneId}
                        onValueChange={(key) => {
                          if (key && TONE_IDS.has(String(key) as AlarmToneId)) {
                            updatePreset(preset.id, { toneId: String(key) as AlarmToneId });
                          }
                        }}
                      />
                    </HStack>
                    <Button onClick={() => startFromPreset(preset)} className={classes.touchButton}>
                      <IconPlayerPlay size={18} />
                      Start
                    </Button>
                  </Stack>
                </Surface>
              );
            })}
          </Stack>
        </Stack>
      )}
    </div>
  );
}

export function TimersWidgetSettings({ widget, onConfigChange }: WidgetProps<TimersConfig>) {
  const transparentBackground = widget.config.transparentBackground ?? false;

  return (
    <Stack gap="md">
      <Text size="xs" tone="secondary">
        Create timer presets here, then start and manage timers directly on the display.
      </Text>
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

import { useCallback } from "react";
import {
  Chip,
  HStack,
  IconButton,
  Select,
  Stack,
  Surface,
  Switch,
  Text,
  TextField,
  TimeInput,
} from "@var-ui/react";
import type { Time } from "@internationalized/date";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import type { AlarmDefinition, AlarmToneId } from "@homeslate/schema";
import { isValidTime } from "./isValidTime";
import { ALARM_TONE_OPTIONS } from "./tones";
import { hhMmFromTime, timeFromHhMm } from "../dateValue";
import { useOverlayPortalContainer } from "../overlayPortal";
import * as classes from "./AlarmListEditor.styles";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TONE_OPTIONS = ALARM_TONE_OPTIONS.map((option) => ({
  id: option.value,
  label: option.label,
}));

function summarizeDays(days: number[]): string {
  if (days.length === 7) return "Every day";
  if (days.length === 0) return "Never";
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES_SHORT[d])
    .join(", ");
}

function AlarmTimeInput({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (time: string) => void;
  "aria-label"?: string;
  className?: string;
}) {
  const timeValue = timeFromHhMm(value);

  return (
    <TimeInput
      {...props}
      value={timeValue}
      onChange={(next: Time | null) => {
        const hhmm = hhMmFromTime(next);
        if (isValidTime(hhmm)) onChange(hhmm);
      }}
    />
  );
}

function createAlarm(): AlarmDefinition {
  return {
    id: uuidv4(),
    label: "Alarm",
    enabled: true,
    time: "07:00",
    days: [0, 1, 2, 3, 4, 5, 6],
    toneId: "chime",
  };
}

interface AlarmListEditorProps {
  alarms: AlarmDefinition[];
  onChange: (alarms: AlarmDefinition[]) => void;
  readOnly?: boolean;
}

export function AlarmListEditor({ alarms, onChange, readOnly = false }: AlarmListEditorProps) {
  const portalContainer = useOverlayPortalContainer();
  const updateAlarm = useCallback(
    (id: string, patch: Partial<AlarmDefinition>) => {
      onChange(alarms.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    },
    [alarms, onChange],
  );

  const toggleDay = useCallback(
    (id: string, day: number) => {
      const alarm = alarms.find((a) => a.id === id);
      if (!alarm) return;
      const nextDays = alarm.days.includes(day)
        ? alarm.days.filter((d) => d !== day)
        : [...alarm.days, day].sort((a, b) => a - b);
      updateAlarm(id, { days: nextDays });
    },
    [alarms, updateAlarm],
  );

  const handleAdd = useCallback(() => {
    onChange([...alarms, createAlarm()]);
  }, [alarms, onChange]);

  const handleDelete = useCallback(
    (id: string) => {
      onChange(alarms.filter((a) => a.id !== id));
    },
    [alarms, onChange],
  );

  if (alarms.length === 0) {
    return (
      <Stack gap="sm" className={classes.list}>
        <Text size="sm" tone="secondary">
          No alarms set.
        </Text>
        {!readOnly && (
          <IconButton
            name="check"
            icon={<IconPlus size={18} />}
            appearance="subtle"
            size="lg"
            onPress={handleAdd}
            aria-label="Add alarm"
            className={classes.addBtn}
          />
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="sm" className={classes.list}>
      {alarms.map((alarm) => (
        <Surface key={alarm.id} padding="sm" className={classes.card}>
          {readOnly ? (
            <HStack justify="between" align="start">
              <Stack gap="xs">
                <Text size="sm" weight="semibold">
                  {alarm.label || "Alarm"}
                </Text>
                <Text size="xs" tone="secondary">
                  {alarm.time} · {summarizeDays(alarm.days)}
                </Text>
              </Stack>
              <Switch
                isSelected={alarm.enabled}
                isDisabled
                aria-label={`${alarm.label || "Alarm"} enabled`}
              />
            </HStack>
          ) : (
            <Stack gap="xs">
              <HStack justify="between" gap="xs">
                <TextField
                  value={alarm.label}
                  onChange={(label) => updateAlarm(alarm.id, { label })}
                  placeholder="Alarm"
                  size="sm"
                  style={{ flex: 1, minWidth: 0 }}
                  aria-label="Alarm label"
                />
                <Switch
                  isSelected={alarm.enabled}
                  onChange={(enabled) => updateAlarm(alarm.id, { enabled })}
                  aria-label="Alarm enabled"
                />
                <IconButton
                  name="close"
                  icon={<IconTrash size={16} />}
                  appearance="ghost"
                  tone="danger"
                  onPress={() => handleDelete(alarm.id)}
                  aria-label="Delete alarm"
                />
              </HStack>
              <HStack gap="xs" wrap>
                <AlarmTimeInput
                  value={alarm.time}
                  onChange={(time) => updateAlarm(alarm.id, { time })}
                  aria-label="Alarm time"
                  className={classes.timeInput}
                />
                <Select
                  options={TONE_OPTIONS}
                  selectedKey={alarm.toneId}
                  onSelectionChange={(key) =>
                    key != null && updateAlarm(alarm.id, { toneId: String(key) as AlarmToneId })
                  }
                  aria-label="Alarm tone"
                  className={classes.toneSelect}
                  portalContainer={portalContainer}
                />
              </HStack>
              <HStack gap="xs" className={classes.dayRow}>
                {DAY_LABELS.map((label, idx) => {
                  const active = alarm.days.includes(idx);
                  return (
                    <Chip
                      key={idx}
                      isSelected={active}
                      onChange={() => toggleDay(alarm.id, idx)}
                      aria-label={DAY_NAMES_SHORT[idx]}
                    >
                      {label}
                    </Chip>
                  );
                })}
              </HStack>
            </Stack>
          )}
        </Surface>
      ))}
      {!readOnly && (
        <IconButton
          name="check"
          icon={<IconPlus size={18} />}
          appearance="subtle"
          size="lg"
          onPress={handleAdd}
          aria-label="Add alarm"
          className={classes.addBtn}
        />
      )}
    </Stack>
  );
}

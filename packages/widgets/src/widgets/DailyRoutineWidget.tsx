import {
  Button,
  Checkbox,
  IconButton,
  HStack,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import {
  IconBackpack,
  IconBed,
  IconBook,
  IconDental,
  IconDroplet,
  IconPlus,
  IconShirt,
  IconShoe,
  IconStar,
  IconSun,
  IconToolsKitchen2,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import type { ComponentType } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { HoldToConfirm } from "../household/HoldToConfirm";
import { effectiveCompletedStepIds, routineDayKey, toggleRoutineStep } from "./dailyRoutine";
import * as classes from "./listWidget.styles";

export const ROUTINE_ICON_IDS = [
  "sun",
  "bed",
  "utensils",
  "shirt",
  "toothbrush",
  "backpack",
  "shoes",
  "book",
  "soap",
  "star",
] as const;

export type RoutineIconId = (typeof ROUTINE_ICON_IDS)[number];

export type RoutineStep = {
  id: string;
  label: string;
  icon?: RoutineIconId;
};

export interface DailyRoutineConfig extends WidgetConfig {
  steps: RoutineStep[];
  resetHour: number;
  completionDay: string | null;
  completedStepIds: string[];
  showReset: boolean;
  transparentBackground: boolean;
}

const ICONS: Record<RoutineIconId, ComponentType<{ size?: number }>> = {
  sun: IconSun,
  bed: IconBed,
  utensils: IconToolsKitchen2,
  shirt: IconShirt,
  toothbrush: IconDental,
  backpack: IconBackpack,
  shoes: IconShoe,
  book: IconBook,
  soap: IconDroplet,
  star: IconStar,
};

const ICON_OPTIONS = [
  { value: "none", label: "No icon" },
  ...ROUTINE_ICON_IDS.map((id) => ({ value: id, label: id })),
];

function iconOf(id: RoutineIconId | undefined) {
  return id && ICONS[id] ? ICONS[id] : null;
}

export function DailyRoutineWidget({
  widget,
  isEditing,
  onConfigChange,
}: WidgetProps<DailyRoutineConfig>) {
  const {
    steps = [],
    resetHour = 4,
    completionDay = null,
    completedStepIds = [],
    showReset = true,
    transparentBackground,
  } = widget.config;
  const now = new Date();
  const dayKey = routineDayKey(now, resetHour);
  const doneIds = new Set(
    effectiveCompletedStepIds(completionDay, completedStepIds, now, resetHour),
  );
  const doneCount = steps.filter((step) => doneIds.has(step.id)).length;

  const persistToggle = (stepId: string) => {
    onConfigChange({
      completionDay: dayKey,
      completedStepIds: toggleRoutineStep([...doneIds], stepId),
    });
  };

  const persistReset = () => {
    onConfigChange({ completionDay: dayKey, completedStepIds: [] });
  };

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {steps.length === 0 ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            Add morning steps in the editor.
          </Text>
        </div>
      ) : (
        <>
          <div className={classes.header}>
            <Text size="sm" tone="secondary">
              {doneCount} of {steps.length}
            </Text>
            {showReset &&
              (isEditing ? (
                <IconButton
                  icon={<IconTrash size={14} />}
                  appearance="ghost"
                  size="sm"
                  aria-label="Reset day"
                  onClick={persistReset}
                />
              ) : (
                <HoldToConfirm label="Reset day" onConfirm={persistReset} />
              ))}
          </div>
          {doneCount === steps.length && (
            <Text size="sm" weight="semibold">
              All done
            </Text>
          )}
          <div className={classes.list}>
            {steps.map((step, index) => {
              const Icon = iconOf(step.icon);
              const done = doneIds.has(step.id);
              return (
                <HStack
                  key={step.id}
                  align="center"
                  className={`${classes.row} ${classes.routineRow} ${done ? classes.rowDone : ""}`}
                >
                  <span className={classes.number}>{index + 1}</span>
                  {Icon ? <Icon size={22} /> : null}
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => persistToggle(step.id)}
                    aria-label={step.label}
                  >
                    <Text size="sm" className={classes.label}>
                      {step.label}
                    </Text>
                  </Checkbox>
                </HStack>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function DailyRoutineWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<DailyRoutineConfig>) {
  const { steps = [], resetHour = 4, showReset = true, transparentBackground } = widget.config;

  const updateStep = (id: string, patch: Partial<RoutineStep>) => {
    onConfigChange({
      steps: steps.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    });
  };

  const move = (index: number, delta: number) => {
    const next = [...steps];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onConfigChange({ steps: next });
  };

  return (
    <Stack gap="md">
      {steps.map((step, index) => (
        <Stack key={step.id} gap="xs">
          <TextField
            size="sm"
            value={step.label}
            onValueChange={(value) => updateStep(step.id, { label: value })}
            aria-label={`Step ${index + 1} label`}
          />
          <HStack gap="xs">
            <Select
              aria-label={`Step ${index + 1} icon`}
              options={ICON_OPTIONS}
              value={step.icon ?? "none"}
              onValueChange={(key) =>
                updateStep(step.id, {
                  icon:
                    !key || key === "none" ? undefined : (String(key) as RoutineIconId | undefined),
                })
              }
              style={{ flex: 1 }}
            />
            <IconButton
              icon={<IconArrowUp size={14} />}
              appearance="ghost"
              aria-label="Move up"
              onClick={() => move(index, -1)}
            />
            <IconButton
              icon={<IconArrowDown size={14} />}
              appearance="ghost"
              aria-label="Move down"
              onClick={() => move(index, 1)}
            />
            <IconButton
              icon={<IconTrash size={14} />}
              appearance="ghost"
              tone="danger"
              aria-label="Remove step"
              onClick={() => onConfigChange({ steps: steps.filter((item) => item.id !== step.id) })}
            />
          </HStack>
        </Stack>
      ))}
      <Button
        appearance="subtle"
        size="sm"
        aria-label="Add step"
        onClick={() =>
          onConfigChange({
            steps: [...steps, { id: uuidv4(), label: "New step", icon: "star" }],
          })
        }
      >
        <IconPlus size={16} />
        Add step
      </Button>
      <NumberInput
        label="Reset hour"
        min={0}
        max={23}
        value={resetHour}
        onValueChange={(value) => {
          if (typeof value === "number") onConfigChange({ resetHour: value });
        }}
      />
      <HStack justify="between">
        <Text size="sm">Show reset control</Text>
        <Switch
          aria-label="Show reset control"
          checked={showReset}
          onCheckedChange={(value) => onConfigChange({ showReset: value })}
        />
      </HStack>
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

import {
  IconButton,
  Button,
  Checkbox,
  HStack,
  Select,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import type { WidgetConfig, WidgetProps } from "../types";
import { useHousehold } from "../household/HouseholdContext";
import {
  civilDayKey,
  isChoreDueOn,
  pruneCompletions,
  toggleChoreCompletion,
  type ChoreCompletion,
} from "./chores";
import { useOverlayPortalContainer } from "../overlayPortal";
import * as classes from "./listWidget.styles";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export type Chore = {
  id: string;
  title: string;
  assigneeId?: string;
  days: number[];
};

export interface ChoresConfig extends WidgetConfig {
  chores: Chore[];
  completions: ChoreCompletion[];
  showCompleted: boolean;
  onlyToday: boolean;
  transparentBackground: boolean;
}

export function ChoresWidget({ widget, onConfigChange }: WidgetProps<ChoresConfig>) {
  const {
    chores = [],
    completions = [],
    showCompleted = true,
    onlyToday = true,
    transparentBackground,
  } = widget.config;
  const { members } = useHousehold();
  const today = civilDayKey(new Date());
  const weekday = new Date().getDay();
  const pruned = pruneCompletions(completions, today);
  const done = new Set(
    pruned.filter((completion) => completion.day === today).map((completion) => completion.choreId),
  );

  const due = chores.filter((chore) => !onlyToday || isChoreDueOn(chore.days, weekday));
  const visible = showCompleted ? due : due.filter((chore) => !done.has(chore.id));

  const toggle = (choreId: string) => {
    onConfigChange({ completions: toggleChoreCompletion(pruned, choreId, today) });
  };

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {chores.length === 0 && members.length === 0 ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            Add people under Household, then add chores.
          </Text>
        </div>
      ) : visible.length === 0 ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            {chores.length === 0 ? "Add chores in settings." : "Nothing due today."}
          </Text>
        </div>
      ) : (
        <div className={classes.list}>
          {visible.map((chore) => {
            const member = members.find((item) => item.id === chore.assigneeId);
            const complete = done.has(chore.id);
            return (
              <HStack
                key={chore.id}
                align="center"
                className={`${classes.row} ${complete ? classes.rowDone : ""}`}
              >
                <span
                  className={classes.disc}
                  style={{
                    background: member?.color ?? "var(--var-ui-color-text-secondary)",
                  }}
                  aria-hidden
                >
                  {member?.name.trim().charAt(0).toUpperCase() ?? "?"}
                </span>
                <Checkbox
                  isSelected={complete}
                  onChange={() => toggle(chore.id)}
                  aria-label={chore.title}
                >
                  <Text size="sm" className={classes.label}>
                    {chore.title}
                  </Text>
                </Checkbox>
              </HStack>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChoresWidgetSettings({ widget, onConfigChange }: WidgetProps<ChoresConfig>) {
  const {
    chores = [],
    showCompleted = true,
    onlyToday = true,
    transparentBackground,
  } = widget.config;
  const { members } = useHousehold();
  const portalContainer = useOverlayPortalContainer();

  const update = (id: string, patch: Partial<Chore>) => {
    onConfigChange({
      chores: chores.map((chore) => (chore.id === id ? { ...chore, ...patch } : chore)),
    });
  };

  return (
    <Stack gap="md">
      <Text size="xs" tone="secondary">
        Household members are edited in the Household panel, not here.
      </Text>
      {chores.map((chore) => (
        <Stack key={chore.id} gap="xs">
          <HStack gap="xs">
            <TextField
              size="sm"
              value={chore.title}
              onChange={(value) => update(chore.id, { title: value })}
              style={{ flex: 1 }}
              aria-label="Chore title"
            />
            <IconButton
              name="close"
              icon={<IconTrash size={14} />}
              appearance="ghost"
              tone="danger"
              aria-label="Remove chore"
              onPress={() =>
                onConfigChange({ chores: chores.filter((item) => item.id !== chore.id) })
              }
            />
          </HStack>
          <Select
            label="Assignee"
            options={[
              { id: "unassigned", label: "Unassigned" },
              ...members.map((member) => ({ id: member.id, label: member.name })),
            ]}
            selectedKey={chore.assigneeId ?? "unassigned"}
            onSelectionChange={(key) =>
              update(chore.id, {
                assigneeId: !key || key === "unassigned" ? undefined : String(key),
              })
            }
            portalContainer={portalContainer}
          />
          <HStack gap="xs">
            {DAY_LABELS.map((label, day) => {
              const active = chore.days.includes(day);
              return (
                <Button
                  key={`${chore.id}-${day}`}
                  size="sm"
                  appearance={active ? "filled" : "outline"}
                  onPress={() => {
                    const days = active
                      ? chore.days.filter((item) => item !== day)
                      : [...chore.days, day].sort((a, b) => a - b);
                    update(chore.id, { days });
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </HStack>
        </Stack>
      ))}
      <Button
        appearance="subtle"
        size="sm"
        onPress={() =>
          onConfigChange({
            chores: [...chores, { id: uuidv4(), title: "New chore", days: [] }],
          })
        }
      >
        <IconPlus size={14} />
        Add chore
      </Button>
      <HStack justify="between">
        <Text size="sm">Show completed</Text>
        <Switch
          aria-label="Show completed"
          isSelected={showCompleted}
          onChange={(value) => onConfigChange({ showCompleted: value })}
        />
      </HStack>
      <HStack justify="between">
        <Text size="sm">Only today</Text>
        <Switch
          aria-label="Only today"
          isSelected={onlyToday}
          onChange={(value) => onConfigChange({ onlyToday: value })}
        />
      </HStack>
      <HStack justify="between">
        <Text size="sm">Transparent background</Text>
        <Switch
          aria-label="Transparent background"
          isSelected={transparentBackground}
          onChange={(value) => onConfigChange({ transparentBackground: value })}
        />
      </HStack>
    </Stack>
  );
}

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  Button,
  Checkbox,
  HStack,
  IconButton,
  SegmentedControl,
  Select,
  Spinner,
  Stack,
  Surface,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import { IconCheckbox, IconPlus, IconRefresh, IconX } from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import type { WidgetProps, WidgetConfig } from "../types";
import { useOverlayPortalContainer } from "../overlayPortal";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useHomeAssistantTodo, useTodoEntities } from "../hooks/useHomeAssistantTodo";
import { TODO_EMPTY_COPY, TODO_MISSING_CONFIG_COPY } from "./homeAssistantTodo";
import * as classes from "./TodoWidget.styles";

export type TodoSource = "local" | "homeAssistant";

export interface TodoItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface TodoConfig extends WidgetConfig {
  items: TodoItem[];
  hideCompleted: boolean;
  transparentBackground: boolean;
  /** Where the list lives. Defaults to `local`. */
  source?: TodoSource;
  /** Home Assistant `todo` entity id when `source` is `homeAssistant`. */
  entityId?: string;
}

interface TodoRow {
  id: string;
  text: string;
  checked: boolean;
}

function getLocalChecked(widgetId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`todo_checked_${widgetId}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveLocalChecked(widgetId: string, checked: Set<string>) {
  localStorage.setItem(`todo_checked_${widgetId}`, JSON.stringify([...checked]));
}

/**
 * Shared checklist body used by both list sources so the two stay visually and
 * behaviorally identical.
 */
function TodoRows({
  rows,
  hideCompleted,
  transparentBackground,
  newItemText,
  onNewItemTextChange,
  onAddItem,
  onToggle,
  onRemoveItem,
  disabled = false,
  emptyCopy,
  footer,
}: {
  rows: TodoRow[];
  hideCompleted: boolean;
  transparentBackground: boolean;
  newItemText: string;
  onNewItemTextChange: (value: string) => void;
  onAddItem: () => void;
  onToggle: (id: string) => void;
  onRemoveItem: (id: string) => void;
  disabled?: boolean;
  emptyCopy?: string;
  footer?: ReactNode;
}) {
  const displayRows = hideCompleted ? rows.filter((row) => !row.checked) : rows;
  const allDone = rows.length > 0 && rows.every((row) => row.checked);

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      <Stack gap="xs" className={classes.list}>
        {displayRows.map((row) => (
          <div
            key={row.id}
            className={`${classes.itemRow} ${row.checked ? classes.itemChecked : ""}`}
          >
            <div className={classes.item}>
              <Checkbox
                isSelected={row.checked}
                isDisabled={disabled}
                onChange={() => onToggle(row.id)}
                aria-label={row.text}
              >
                <Text className={classes.itemText} size="sm">
                  {row.text}
                </Text>
              </Checkbox>
            </div>
            <IconButton
              name="close"
              icon={<IconX size={14} />}
              appearance="ghost"
              tone="danger"
              size="sm"
              className={classes.deleteBtn}
              isDisabled={disabled}
              onPress={() => onRemoveItem(row.id)}
              aria-label="Delete item"
            />
          </div>
        ))}
        {rows.length === 0 && emptyCopy && (
          <div className={classes.empty}>
            <Text size="sm" tone="secondary">
              {emptyCopy}
            </Text>
          </div>
        )}
        <HStack gap="xs" className={classes.addRow}>
          <TextField
            size="sm"
            aria-label="Add item"
            placeholder="Add item..."
            value={newItemText}
            onChange={onNewItemTextChange}
            onKeyDown={(e) => e.key === "Enter" && onAddItem()}
            style={{ flex: 1 }}
          />
          <IconButton
            name="check"
            icon={<IconPlus size={14} />}
            appearance="subtle"
            aria-label="Add item"
            onPress={onAddItem}
            isDisabled={disabled || !newItemText.trim()}
          />
        </HStack>
      </Stack>
      {allDone && displayRows.length === 0 && (
        <Text size="sm" tone="secondary" style={{ textAlign: "center", marginTop: "0.5rem" }}>
          All done! ✓
        </Text>
      )}
      {footer}
    </div>
  );
}

function LocalTodoWidget({ widget, isEditing, onConfigChange }: WidgetProps<TodoConfig>) {
  const { items, hideCompleted, transparentBackground } = widget.config;
  const [localChecked, setLocalChecked] = useState<Set<string>>(() => getLocalChecked(widget.id));
  const [newItemText, setNewItemText] = useState("");
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    setLocalChecked(getLocalChecked(widget.id));
  }, [widget.id, items]);

  const rows = items.map((item) => ({
    ...item,
    checked: isEditing ? item.checked : localChecked.has(item.id),
  }));

  const handleToggle = useCallback(
    (id: string) => {
      if (isEditing) {
        onConfigChange({
          items: itemsRef.current.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
        });
      } else {
        setLocalChecked((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          saveLocalChecked(widget.id, next);
          return next;
        });
      }
    },
    [isEditing, onConfigChange, widget.id],
  );

  const handleAddItem = useCallback(() => {
    const text = newItemText.trim();
    if (!text) return;
    onConfigChange({ items: [...itemsRef.current, { id: uuidv4(), text, checked: false }] });
    setNewItemText("");
  }, [newItemText, onConfigChange]);

  const handleRemoveItem = useCallback(
    (id: string) => {
      onConfigChange({ items: itemsRef.current.filter((i) => i.id !== id) });
    },
    [onConfigChange],
  );

  return (
    <TodoRows
      rows={rows}
      hideCompleted={hideCompleted}
      transparentBackground={transparentBackground}
      newItemText={newItemText}
      onNewItemTextChange={setNewItemText}
      onAddItem={handleAddItem}
      onToggle={handleToggle}
      onRemoveItem={handleRemoveItem}
    />
  );
}

function RetryButton({ onPress }: { onPress: () => void }) {
  return (
    <Button appearance="subtle" size="sm" onPress={onPress}>
      <IconRefresh size={14} />
      Retry
    </Button>
  );
}

function HomeAssistantTodoWidget({ widget }: WidgetProps<TodoConfig>) {
  const { hideCompleted, transparentBackground, entityId = "" } = widget.config;
  const {
    items,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
    addItem,
    setCompleted,
    removeItem,
  } = useHomeAssistantTodo(entityId);
  const [newItemText, setNewItemText] = useState("");
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconCheckbox size={40} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            {TODO_EMPTY_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (status === 501) {
    return (
      <div className={containerClass}>
        <Surface className={classes.notice} padding="sm">
          <Text size="sm">{TODO_MISSING_CONFIG_COPY}</Text>
        </Surface>
      </div>
    );
  }

  const loaded = lastUpdated !== null;

  if (isLoading && !loaded) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error && !loaded) {
    return (
      <div className={containerClass}>
        <div className={classes.error}>
          <Text size="sm" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
            {error}
          </Text>
          <RetryButton onPress={refresh} />
        </div>
      </div>
    );
  }

  const handleAddItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    setNewItemText("");
    void addItem(text);
  };

  const rows: TodoRow[] = items.map((item) => ({
    id: item.uid,
    text: item.summary,
    checked: item.status === "completed",
  }));

  return (
    <TodoRows
      rows={rows}
      hideCompleted={hideCompleted}
      transparentBackground={transparentBackground}
      newItemText={newItemText}
      onNewItemTextChange={setNewItemText}
      onAddItem={handleAddItem}
      onToggle={(id) => {
        const item = items.find((entry) => entry.uid === id);
        if (item) void setCompleted(id, item.status !== "completed");
      }}
      onRemoveItem={(id) => void removeItem(id)}
      disabled={pending}
      emptyCopy="No items"
      footer={
        <>
          {controlError && (
            <Text size="xs" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
              {controlError}
            </Text>
          )}
          {lastUpdated !== null && (
            <WidgetDataStatus
              widgetId={widget.id}
              lastUpdated={lastUpdated}
              isStale={isStale}
              error={error}
              isLoading={isLoading}
            />
          )}
        </>
      }
    />
  );
}

export function TodoWidget(props: WidgetProps<TodoConfig>) {
  const source = props.widget.config.source ?? "local";
  if (source === "homeAssistant") return <HomeAssistantTodoWidget {...props} />;
  return <LocalTodoWidget {...props} />;
}

function HomeAssistantTodoSettings({
  widget,
  onConfigChange,
}: Pick<WidgetProps<TodoConfig>, "widget" | "onConfigChange">) {
  const portalContainer = useOverlayPortalContainer();
  const { entityId = "" } = widget.config;
  const { entities, isLoading, error, status, refresh } = useTodoEntities();

  if (status === 501) {
    return (
      <Surface className={classes.notice} padding="sm">
        <Text size="sm">{TODO_MISSING_CONFIG_COPY}</Text>
      </Surface>
    );
  }

  return (
    <Stack gap="xs">
      <HStack gap="xs">
        <div className={classes.fieldGrow}>
          <Select
            label="List"
            placeholder="Select a list…"
            options={entities.map((entity) => ({
              id: entity.entityId,
              label: `${entity.name} (${entity.entityId})`,
            }))}
            selectedKey={entityId || null}
            onSelectionChange={(key) => {
              if (typeof key === "string") onConfigChange({ entityId: key });
            }}
            portalContainer={portalContainer}
          />
        </div>
        <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
          <IconRefresh size={14} />
          Refresh
        </Button>
      </HStack>

      {error && status !== 501 && (
        <Text size="xs" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
          {error}
        </Text>
      )}
    </Stack>
  );
}

export function TodoWidgetSettings({ widget, onConfigChange }: WidgetProps<TodoConfig>) {
  const { hideCompleted, transparentBackground, source = "local" } = widget.config;

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text size="sm">List source</Text>
        <SegmentedControl
          size="sm"
          aria-label="List source"
          options={[
            { id: "local", label: "Local" },
            { id: "homeAssistant", label: "Home Assistant" },
          ]}
          selectedKeys={[source]}
          onSelectionChange={(keys) => {
            const next = [...keys][0];
            if (next === "local" || next === "homeAssistant") onConfigChange({ source: next });
          }}
        />
        <Text size="xs" tone="secondary">
          {source === "homeAssistant"
            ? "Items live in Home Assistant and stay in sync across displays and devices."
            : "Add, remove, and check off items directly on the display."}
        </Text>
      </Stack>

      {source === "homeAssistant" && (
        <HomeAssistantTodoSettings widget={widget} onConfigChange={onConfigChange} />
      )}

      <HStack justify="between">
        <Text size="sm">Hide completed items</Text>
        <Switch
          aria-label="Hide completed items"
          isSelected={hideCompleted}
          onChange={(value) => onConfigChange({ hideCompleted: value })}
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

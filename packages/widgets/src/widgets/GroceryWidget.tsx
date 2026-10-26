import {
  Button,
  Checkbox,
  HStack,
  IconButton,
  Select,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import { IconPlus, IconRefresh, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { WidgetConfig, WidgetProps } from "../types";
import { HoldToConfirm } from "../household/HoldToConfirm";
import { useHomeAssistantTodo, useTodoEntities } from "../hooks/useHomeAssistantTodo";
import { useOverlayPortalContainer } from "../overlayPortal";
import { clearCheckedGroceryItems, visibleGroceryItems, type GroceryItem } from "./grocery";
import * as classes from "./listWidget.styles";
import { ErrorText } from "../ErrorText";

export interface GroceryConfig extends WidgetConfig {
  items: GroceryItem[];
  hideChecked: boolean;
  groupByAisle: boolean;
  transparentBackground: boolean;
  source?: "local" | "homeAssistant";
  entityId?: string;
}

const GROCERY_HA_EMPTY_COPY = "Pick a Home Assistant list in settings.";
const GROCERY_HA_MISSING_CONFIG_COPY =
  "Set HOMEASSISTANT_BASE_URL and HOMEASSISTANT_TOKEN on the server.";

export function GroceryWidget(props: WidgetProps<GroceryConfig>) {
  const { source = "local", entityId = "" } = props.widget.config;
  if (source === "homeAssistant") {
    return <HomeAssistantGroceryList {...props} entityId={entityId} />;
  }
  return <LocalGroceryList {...props} />;
}

function LocalGroceryList({ widget, isEditing, onConfigChange }: WidgetProps<GroceryConfig>) {
  const {
    items = [],
    hideChecked = false,
    groupByAisle = false,
    transparentBackground,
  } = widget.config;
  const [draft, setDraft] = useState("");
  const visible = visibleGroceryItems(items, { hideChecked, groupByAisle });

  const toggle = (id: string) => {
    onConfigChange({
      items: items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    });
  };

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onConfigChange({
      items: [...items, { id: uuidv4(), text, checked: false }],
    });
    setDraft("");
  };

  const remove = (id: string) => {
    onConfigChange({ items: items.filter((item) => item.id !== id) });
  };

  const clearChecked = () => {
    onConfigChange({ items: clearCheckedGroceryItems(items) });
  };

  let lastAisle: string | undefined;

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {items.length === 0 ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            List is empty. Add milk from here or in the editor.
          </Text>
        </div>
      ) : (
        <div className={classes.list}>
          {visible.map((item) => {
            const aisle = groupByAisle ? (item.aisle?.trim() ?? "") : "";
            const showAisle = groupByAisle && aisle && aisle !== lastAisle;
            if (groupByAisle) lastAisle = aisle;
            return (
              <div key={item.id}>
                {showAisle && <div className={classes.aisle}>{aisle}</div>}
                <HStack
                  align="center"
                  gap="xs"
                  className={`${classes.row} ${item.checked ? classes.rowDone : ""}`}
                >
                  <Checkbox
                    isSelected={item.checked}
                    onChange={() => toggle(item.id)}
                    aria-label={item.text}
                  >
                    <Text size="sm" className={classes.label}>
                      {item.text}
                    </Text>
                  </Checkbox>
                  <IconButton
                    name="close"
                    icon={<IconTrash size={14} />}
                    appearance="ghost"
                    tone="danger"
                    aria-label={`Delete ${item.text}`}
                    onPress={() => {
                      if (isEditing || window.confirm(`Delete ${item.text}?`)) {
                        remove(item.id);
                      }
                    }}
                  />
                </HStack>
              </div>
            );
          })}
        </div>
      )}
      <div className={classes.addRow}>
        <TextField
          size="sm"
          aria-label="Add item"
          placeholder="Add item..."
          value={draft}
          onChange={setDraft}
          onKeyDown={(event) => event.key === "Enter" && add()}
          style={{ flex: 1 }}
        />
        <IconButton
          name="check"
          icon={<IconPlus size={14} />}
          appearance="subtle"
          onPress={add}
          isDisabled={!draft.trim()}
          aria-label="Add item"
        />
      </div>
      {items.some((item) => item.checked) &&
        (isEditing ? (
          <Button size="sm" appearance="ghost" onPress={clearChecked}>
            Clear checked
          </Button>
        ) : (
          <HoldToConfirm label="Clear checked" onConfirm={clearChecked} />
        ))}
    </div>
  );
}

function HomeAssistantGroceryList({
  widget,
  isEditing,
  entityId,
}: WidgetProps<GroceryConfig> & { entityId: string }) {
  const { hideChecked = false, transparentBackground = false } = widget.config;
  const {
    items,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    addItem,
    setCompleted,
    removeItem,
    refresh,
  } = useHomeAssistantTodo(entityId);
  const [draft, setDraft] = useState("");
  const visible = hideChecked ? items.filter((item) => item.status !== "completed") : items;

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    void addItem(text);
    setDraft("");
  };

  const clearChecked = () => {
    void Promise.all(
      items.filter((item) => item.status === "completed").map((i) => removeItem(i.uid)),
    );
  };

  if (!entityId) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            {GROCERY_HA_EMPTY_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (status === 501) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <Text size="sm" weight="medium">
            Home Assistant isn't connected
          </Text>
          <Text size="sm" tone="secondary">
            {error ?? GROCERY_HA_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  const hasChecked = items.some((item) => item.status === "completed");

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {(error || controlError) && (
        <HStack justify="between" align="center" gap="sm">
          <ErrorText size="sm">{controlError ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </HStack>
      )}
      {visible.length === 0 ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            List is empty. Add milk from here or in the Home Assistant app.
          </Text>
        </div>
      ) : (
        <div className={classes.list}>
          {visible.map((item) => {
            const checked = item.status === "completed";
            return (
              <HStack
                key={item.uid}
                align="center"
                gap="xs"
                className={`${classes.row} ${checked ? classes.rowDone : ""}`}
              >
                <Checkbox
                  isSelected={checked}
                  onChange={() => void setCompleted(item.uid, !checked)}
                  aria-label={item.summary}
                >
                  <Text size="sm" className={classes.label}>
                    {item.summary}
                  </Text>
                </Checkbox>
                <IconButton
                  name="close"
                  icon={<IconTrash size={14} />}
                  appearance="ghost"
                  tone="danger"
                  aria-label={`Delete ${item.summary}`}
                  onPress={() => {
                    if (isEditing || window.confirm(`Delete ${item.summary}?`)) {
                      void removeItem(item.uid);
                    }
                  }}
                />
              </HStack>
            );
          })}
        </div>
      )}
      <div className={classes.addRow}>
        <TextField
          size="sm"
          aria-label="Add item"
          placeholder="Add item..."
          value={draft}
          onChange={setDraft}
          onKeyDown={(event) => event.key === "Enter" && add()}
          style={{ flex: 1 }}
        />
        <IconButton
          name="check"
          icon={<IconPlus size={14} />}
          appearance="subtle"
          onPress={add}
          isDisabled={!draft.trim()}
          aria-label="Add item"
        />
      </div>
      {hasChecked &&
        (isEditing ? (
          <Button size="sm" appearance="ghost" onPress={clearChecked}>
            Clear checked
          </Button>
        ) : (
          <HoldToConfirm label="Clear checked" onConfirm={clearChecked} />
        ))}
      {!isEditing && (
        <Text size="xs" tone="secondary" style={{ textAlign: "center" }}>
          {lastUpdated ? (isStale ? "Showing saved list" : "Synced with Home Assistant") : ""}
        </Text>
      )}
    </div>
  );
}

export function GroceryWidgetSettings({ widget, onConfigChange }: WidgetProps<GroceryConfig>) {
  const {
    items = [],
    hideChecked,
    groupByAisle,
    transparentBackground,
    source = "local",
    entityId = "",
  } = widget.config;
  const portalContainer = useOverlayPortalContainer();
  const {
    entities: todoEntities,
    status: entitiesStatus,
    error: entitiesError,
  } = useTodoEntities();

  return (
    <Stack gap="md">
      <Select
        label="Source"
        options={[
          { id: "local", label: "Local list" },
          { id: "homeAssistant", label: "Home Assistant" },
        ]}
        selectedKey={source}
        onSelectionChange={(value) => {
          if (value === "local" || value === "homeAssistant") onConfigChange({ source: value });
        }}
        portalContainer={portalContainer}
      />

      {source === "homeAssistant" ? (
        <Stack gap="xs">
          <Select
            label="To-Do List"
            placeholder="Select a list…"
            options={todoEntities.map((entity) => ({
              id: entity.entityId,
              label: `${entity.name} (${entity.entityId})`,
            }))}
            selectedKey={entityId || null}
            onSelectionChange={(value) => {
              if (typeof value === "string") onConfigChange({ entityId: value });
            }}
            portalContainer={portalContainer}
          />
          {entitiesStatus === 501 && (
            <Text size="xs" tone="secondary">
              {entitiesError ?? GROCERY_HA_MISSING_CONFIG_COPY}
            </Text>
          )}
        </Stack>
      ) : (
        <>
          {items.map((item) => (
            <HStack key={item.id} gap="xs">
              <TextField
                size="sm"
                value={item.text}
                onChange={(value) =>
                  onConfigChange({
                    items: items.map((row) => (row.id === item.id ? { ...row, text: value } : row)),
                  })
                }
                style={{ flex: 1 }}
                aria-label="Grocery item"
              />
              <TextField
                size="sm"
                placeholder="Aisle"
                value={item.aisle ?? ""}
                onChange={(value) =>
                  onConfigChange({
                    items: items.map((row) =>
                      row.id === item.id ? { ...row, aisle: value } : row,
                    ),
                  })
                }
                style={{ width: 110 }}
                aria-label="Aisle"
              />
            </HStack>
          ))}
        </>
      )}

      <HStack justify="between">
        <Text size="sm">Hide checked</Text>
        <Switch
          aria-label="Hide checked"
          isSelected={hideChecked}
          onChange={(value) => onConfigChange({ hideChecked: value })}
        />
      </HStack>
      {source !== "homeAssistant" && (
        <HStack justify="between">
          <Text size="sm">Group by aisle</Text>
          <Switch
            aria-label="Group by aisle"
            isSelected={groupByAisle}
            onChange={(value) => onConfigChange({ groupByAisle: value })}
          />
        </HStack>
      )}
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

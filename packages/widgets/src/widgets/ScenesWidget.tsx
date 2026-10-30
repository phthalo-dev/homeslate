import {
  Button,
  HStack,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import {
  IconBulb,
  IconDeviceTv,
  IconMoon,
  IconMusic,
  IconPlayerPlay,
  IconRefresh,
  IconSun,
} from "@tabler/icons-react";
import { useState, type ComponentType } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntityList, useHomeAssistantService } from "../hooks/useHomeAssistant";
import { useOverlayPortalContainer } from "../overlayPortal";
import type { HomeAssistantEntitySummary } from "./homeAssistant";
import { AddEntitySelect, SelectedEntityRow } from "./AddEntitySelect";
import {
  SCENES_EMPTY_COPY,
  SCENES_MISSING_CONFIG_COPY,
  SCENE_DOMAINS,
  sceneLabel,
  sceneService,
  type SceneItem,
} from "./homeAssistantScene";
import * as classes from "./ScenesWidget.styles";
import { ErrorText } from "../ErrorText";

export interface ScenesConfig extends WidgetConfig {
  items: SceneItem[];
  confirm: boolean;
  columns: number;
  transparentBackground: boolean;
}

const SCENE_ICONS: Record<string, ComponentType<{ size?: number | string }>> = {
  play: IconPlayerPlay,
  light: IconBulb,
  night: IconMoon,
  day: IconSun,
  movie: IconDeviceTv,
  music: IconMusic,
};

const ICON_OPTIONS = [
  { id: "play", label: "Play" },
  { id: "light", label: "Light" },
  { id: "night", label: "Night" },
  { id: "day", label: "Day" },
  { id: "movie", label: "Movie" },
  { id: "music", label: "Music" },
];

function SceneGlyph({ name }: { name?: string }) {
  const Icon = (name && SCENE_ICONS[name]) || IconPlayerPlay;
  return <Icon size={20} />;
}

function domainLabel(entityId: string): string {
  const domain = entityId.slice(0, entityId.indexOf("."));
  if (domain === "input_button") return "Button";
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

export function ScenesWidget({ widget, isEditing }: WidgetProps<ScenesConfig>) {
  const { items = [], confirm = false, columns = 2, transparentBackground = false } = widget.config;
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);
  const callService = useHomeAssistantService(SCENES_MISSING_CONFIG_COPY);
  const entityIds = items.map((item) => item.entityId).filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } =
    useEntityList<HomeAssistantEntitySummary>(entityIds, {
      fetchFailureCopy: SCENES_MISSING_CONFIG_COPY,
    });
  const byId = new Map(entities.map((entity) => [entity.entityId, entity]));
  const columnCount = Math.min(4, Math.max(1, Math.round(columns)));

  const fire = async (item: SceneItem) => {
    const target = sceneService(item.entityId);
    if (!target) return;
    const name = item.label?.trim() || byId.get(item.entityId)?.name || sceneLabel(item);
    if (confirm && typeof window !== "undefined" && !window.confirm(`Run ${name}?`)) return;

    setControlError(null);
    setPendingId(item.entityId);
    try {
      await callService(target.domain, target.service, item.entityId, {});
    } catch (err) {
      setControlError(err instanceof Error ? err.message : SCENES_MISSING_CONFIG_COPY);
    } finally {
      setPendingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconPlayerPlay size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{SCENES_EMPTY_COPY}</Text>
        </div>
      </div>
    );
  }

  if (status === 501) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <Text className={classes.emptyTitle}>Home Assistant isn't connected</Text>
          <Text size="sm" tone="secondary">
            {error ?? SCENES_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {(error || controlError) && (
        <div className={classes.errorBox}>
          <ErrorText size="sm">{controlError ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      )}
      <SimpleGrid
        cols={columnCount === 1 || columnCount === 3 || columnCount === 4 ? columnCount : 2}
        spacing="sm"
        className={classes.grid}
      >
        {items.map((item) => {
          const name = item.label?.trim() || byId.get(item.entityId)?.name || sceneLabel(item);
          const pending = pendingId === item.entityId;
          return (
            <Button
              key={item.entityId}
              className={`${classes.card} ${pending ? classes.cardPressed : ""}`}
              onPress={() => void fire(item)}
              isDisabled={pending}
            >
              <span className={classes.cardIcon}>
                <SceneGlyph name={item.icon} />
              </span>
              <Text className={classes.cardLabel}>{name}</Text>
              <Text className={classes.cardDomain}>{domainLabel(item.entityId)}</Text>
            </Button>
          );
        })}
      </SimpleGrid>
      {!isEditing && (
        <WidgetDataStatus
          widgetId={widget.id}
          lastUpdated={lastUpdated}
          isStale={isStale}
          error={error}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export function ScenesSettings({ widget, onConfigChange }: WidgetProps<ScenesConfig>) {
  const { items = [], confirm = false, columns = 2, transparentBackground = false } = widget.config;
  const portalContainer = useOverlayPortalContainer();

  const updateItem = (index: number, patch: Partial<SceneItem>) => {
    onConfigChange({
      items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  };

  return (
    <Stack gap="md">
      <AddEntitySelect
        domains={[...SCENE_DOMAINS]}
        value={items.map((item) => item.entityId)}
        onAdd={(entityId) => onConfigChange({ items: [...items, { entityId }] })}
        failureCopy={SCENES_MISSING_CONFIG_COPY}
        label="Add scene, script, or button"
      />
      {items.map((item, index) => (
        <SelectedEntityRow
          key={item.entityId}
          entityId={item.entityId}
          onRemove={() => onConfigChange({ items: items.filter((_, i) => i !== index) })}
        >
          <TextField
            aria-label={`Label for ${item.entityId}`}
            placeholder="Label (optional)"
            value={item.label ?? ""}
            onChange={(value) => updateItem(index, { label: value })}
          />
          <Select
            label="Icon"
            placeholder="Default"
            options={ICON_OPTIONS}
            selectedKey={item.icon ?? null}
            onSelectionChange={(key) => {
              if (typeof key === "string") updateItem(index, { icon: key });
            }}
            portalContainer={portalContainer}
          />
        </SelectedEntityRow>
      ))}
      <NumberInput
        label="Columns"
        minValue={1}
        maxValue={4}
        value={columns}
        onChange={(value) => {
          const next = Number(value);
          onConfigChange({ columns: Number.isFinite(next) ? Math.min(4, Math.max(1, next)) : 2 });
        }}
      />
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Ask before running</Text>
        <Switch
          aria-label="Ask before running"
          isSelected={confirm}
          onChange={(value) => onConfigChange({ confirm: value })}
        />
      </HStack>
      <HStack gap="sm" align="center" justify="between">
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

import { Button, HStack, Slider, Stack, Switch, Text } from "@var-ui/react";
import {
  IconCarGarage,
  IconChevronDown,
  IconChevronUp,
  IconPlayerStop,
  IconRefresh,
} from "@tabler/icons-react";
import { useState } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntityList, useHomeAssistantService } from "../hooks/useHomeAssistant";
import { AddEntitySelect, SelectedEntityRow } from "./AddEntitySelect";
import {
  COVERS_EMPTY_COPY,
  COVERS_MISSING_CONFIG_COPY,
  COVER_FEATURE_STOP,
  applyCoverOverride,
  coverNeedsOpenConfirm,
  coverStateLabel,
  coverSupports,
  getCoversSizeTier,
  type CoverOverride,
  type HomeAssistantCover,
} from "./homeAssistantCover";
import * as classes from "./CoversWidget.styles";
import { ErrorText } from "../ErrorText";

export interface CoversConfig extends WidgetConfig {
  entityIds: string[];
  showPositionSlider: boolean;
  confirmGarage: boolean;
  transparentBackground: boolean;
}

type CoverOverrideMap = Record<string, CoverOverride>;

export function CoversWidget({ widget, isEditing }: WidgetProps<CoversConfig>) {
  const {
    entityIds = [],
    showPositionSlider = true,
    confirmGarage = true,
    transparentBackground = false,
  } = widget.config;
  const ids = entityIds.filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } =
    useEntityList<HomeAssistantCover>(ids, {
      fetchFailureCopy: COVERS_MISSING_CONFIG_COPY,
    });
  const callService = useHomeAssistantService(COVERS_MISSING_CONFIG_COPY);
  const [overrides, setOverrides] = useState<CoverOverrideMap>({});
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);

  const byId = new Map(entities.map((entity) => [entity.entityId, entity]));
  const merged = (entityId: string): HomeAssistantCover | null => {
    const base = byId.get(entityId);
    if (!base) return null;
    return applyCoverOverride(base, overrides[entityId]);
  };

  const tier = getCoversSizeTier(widget.layout.w, widget.layout.h);
  const showSlider = tier === "full" && showPositionSlider;

  const clearOverride = (entityId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[entityId];
      return next;
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[entityId];
      return next;
    });
  };

  const run = async (
    cover: HomeAssistantCover,
    service: string,
    data: Record<string, unknown>,
    optimistic: CoverOverride,
  ) => {
    if (!cover.available || pendingId === cover.entityId) return;
    setControlError(null);
    setPendingId(cover.entityId);
    setOverrides((prev) => ({
      ...prev,
      [cover.entityId]: { ...prev[cover.entityId], ...optimistic },
    }));
    try {
      await callService("cover", service, cover.entityId, data);
    } catch (err) {
      setControlError(err instanceof Error ? err.message : COVERS_MISSING_CONFIG_COPY);
    } finally {
      await refresh();
      clearOverride(cover.entityId);
      setPendingId(null);
    }
  };

  const open = (cover: HomeAssistantCover) => {
    if (
      confirmGarage &&
      coverNeedsOpenConfirm(cover) &&
      typeof window !== "undefined" &&
      !window.confirm(`Open ${cover.name}?`)
    ) {
      return;
    }
    void run(cover, "open_cover", {}, { state: "opening" });
  };

  const close = (cover: HomeAssistantCover) => {
    void run(cover, "close_cover", {}, { state: "closing" });
  };

  const stop = (cover: HomeAssistantCover) => {
    void run(cover, "stop_cover", {}, {});
  };

  const setPosition = (cover: HomeAssistantCover, value: number) => {
    const position = Math.min(100, Math.max(0, Math.round(value)));
    void run(cover, "set_cover_position", { position }, { position });
  };

  if (ids.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconCarGarage size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{COVERS_EMPTY_COPY}</Text>
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
            {error ?? COVERS_MISSING_CONFIG_COPY}
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

      <div className={classes.list}>
        {ids.map((entityId) => {
          const cover = merged(entityId);
          if (!cover) {
            return (
              <div key={entityId} className={classes.row}>
                <Text size="sm" tone="secondary">
                  Loading…
                </Text>
              </div>
            );
          }
          const pending = pendingId === cover.entityId;
          const openState = cover.state === "open" || cover.state === "opening";
          const showPosition = cover.position !== null && tier !== "compact";
          const sliderValue = drafts[entityId] ?? cover.position ?? 0;
          return (
            <div
              key={entityId}
              className={`${classes.row} ${pending ? classes.rowPending : ""} ${
                cover.available ? "" : classes.rowUnavailable
              }`}
            >
              <div className={classes.rowTop}>
                <span
                  className={classes.stateDot}
                  style={{
                    background: openState
                      ? "var(--var-ui-color-tone-success-foreground)"
                      : "var(--var-ui-color-text-secondary)",
                  }}
                />
                <span className={classes.coverDetails}>
                  <span className={classes.coverName}>{cover.name}</span>
                  <span className={classes.coverState}>{coverStateLabel(cover)}</span>
                </span>
                {showPosition && (
                  <span className={classes.positionLabel}>{Math.round(cover.position!)}%</span>
                )}
              </div>

              <div className={classes.actions}>
                <Button
                  appearance="subtle"
                  size="sm"
                  onPress={() => open(cover)}
                  isDisabled={!cover.available || pending}
                >
                  <IconChevronUp size={14} />
                  Open
                </Button>
                <Button
                  appearance="subtle"
                  size="sm"
                  onPress={() => close(cover)}
                  isDisabled={!cover.available || pending}
                >
                  <IconChevronDown size={14} />
                  Close
                </Button>
                {coverSupports(cover, COVER_FEATURE_STOP) && (
                  <Button
                    appearance="subtle"
                    size="sm"
                    onPress={() => stop(cover)}
                    isDisabled={!cover.available || pending}
                    aria-label={`Stop ${cover.name}`}
                  >
                    <IconPlayerStop size={14} />
                    Stop
                  </Button>
                )}
              </div>

              {showSlider && cover.available && (
                <HStack gap="sm" align="center" className={classes.sliderRow}>
                  <Slider
                    className={classes.range}
                    aria-label={`Position for ${cover.name}`}
                    minValue={0}
                    maxValue={100}
                    step={1}
                    value={sliderValue}
                    showOutput={false}
                    isDisabled={pending}
                    onChange={(value) => {
                      const next = typeof value === "number" ? value : (value[0] ?? sliderValue);
                      setDrafts((prev) => ({ ...prev, [entityId]: next }));
                    }}
                    onChangeEnd={(value) => {
                      const next = typeof value === "number" ? value : (value[0] ?? sliderValue);
                      setPosition(cover, next);
                    }}
                  />
                  <Text size="xs" tone="secondary">
                    {Math.round(sliderValue)}%
                  </Text>
                </HStack>
              )}
            </div>
          );
        })}
      </div>

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

export function CoversWidgetSettings({ widget, onConfigChange }: WidgetProps<CoversConfig>) {
  const {
    entityIds = [],
    showPositionSlider = true,
    confirmGarage = true,
    transparentBackground = false,
  } = widget.config;

  return (
    <Stack gap="md">
      <AddEntitySelect
        domains={["cover"]}
        value={entityIds}
        onAdd={(entityId) => onConfigChange({ entityIds: [...entityIds, entityId] })}
        failureCopy={COVERS_MISSING_CONFIG_COPY}
        label="Add cover or garage door"
      />
      {entityIds.map((entityId) => (
        <SelectedEntityRow
          key={entityId}
          entityId={entityId}
          onRemove={() =>
            onConfigChange({ entityIds: entityIds.filter((value) => value !== entityId) })
          }
        />
      ))}

      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show position slider (when large)</Text>
        <Switch
          aria-label="Show position slider"
          isSelected={showPositionSlider}
          onChange={(value) => onConfigChange({ showPositionSlider: value })}
        />
      </HStack>
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Ask before opening garage doors</Text>
        <Switch
          aria-label="Ask before opening garage doors"
          isSelected={confirmGarage}
          onChange={(value) => onConfigChange({ confirmGarage: value })}
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

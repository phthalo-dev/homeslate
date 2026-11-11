import { Button, HStack, Stack, Switch, Text, TextField } from "@var-ui/react";
import {
  IconBulb,
  IconCarGarage,
  IconChevronDown,
  IconChevronUp,
  IconHome,
  IconPower,
  IconRefresh,
  IconWind,
} from "@tabler/icons-react";
import { useState, type ComponentType } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntityList, useHomeAssistantService } from "../hooks/useHomeAssistant";
import { AddEntitySelect, SelectedEntityRow } from "./AddEntitySelect";
import type { EntityTileDescriptor } from "./homeAssistantTile";
import { ROOM_EMPTY_COPY, ROOM_MISSING_CONFIG_COPY, summarizeRoom } from "./room";
import * as classes from "./RoomWidget.styles";
import { ErrorText } from "../ErrorText";

export interface RoomConfig extends WidgetConfig {
  name: string;
  entityIds: string[];
  transparentBackground: boolean;
}

type RoomOverride = { isOn?: boolean; state?: string; position?: number };

function domainOf(entityId: string): string {
  return entityId.slice(0, entityId.indexOf("."));
}

function roomIcon(row: EntityTileDescriptor): ComponentType<{ size?: number | string }> {
  if (row.control === "position") return IconCarGarage;
  if (row.domain === "light") return IconBulb;
  if (row.domain === "fan") return IconWind;
  if (row.domain === "switch" || row.domain === "input_boolean") return IconPower;
  return IconHome;
}

export function RoomWidget({ widget, isEditing }: WidgetProps<RoomConfig>) {
  const { name = "", entityIds = [], transparentBackground = false } = widget.config;
  const ids = entityIds.filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } = useEntityList<
    Record<string, unknown>
  >(ids, {
    fetchFailureCopy: ROOM_MISSING_CONFIG_COPY,
  });
  const callService = useHomeAssistantService(ROOM_MISSING_CONFIG_COPY);
  const [overrides, setOverrides] = useState<Record<string, RoomOverride>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [controlError, setControlError] = useState<string | null>(null);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  const merged = entities.map((entity) => {
    const entityId = typeof entity.entityId === "string" ? entity.entityId : "";
    return { ...entity, ...overrides[entityId] };
  });
  const summary = summarizeRoom(ids, merged);
  const busy = bulkPending || pendingId !== null;

  const clearOverride = (entityId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[entityId];
      return next;
    });
  };

  const run = async (
    entityId: string,
    service: string,
    data: Record<string, unknown>,
    optimistic: RoomOverride,
  ) => {
    if (busy) return;
    setControlError(null);
    setPendingId(entityId);
    setOverrides((prev) => ({ ...prev, [entityId]: optimistic }));
    try {
      await callService(domainOf(entityId), service, entityId, data);
    } catch (err) {
      setControlError(err instanceof Error ? err.message : ROOM_MISSING_CONFIG_COPY);
    } finally {
      await refresh();
      clearOverride(entityId);
      setPendingId(null);
    }
  };

  const runBulk = async (
    rows: EntityTileDescriptor[],
    serviceFor: (row: EntityTileDescriptor) => string,
    optimisticFor: (row: EntityTileDescriptor) => RoomOverride,
  ) => {
    if (busy || rows.length === 0) return;
    setControlError(null);
    setBulkPending(true);
    setOverrides((prev) => {
      const next = { ...prev };
      for (const row of rows) next[row.entityId] = optimisticFor(row);
      return next;
    });
    try {
      await Promise.all(
        rows.map((row) => callService(domainOf(row.entityId), serviceFor(row), row.entityId, {})),
      );
    } catch (err) {
      setControlError(err instanceof Error ? err.message : ROOM_MISSING_CONFIG_COPY);
    } finally {
      await refresh();
      setOverrides({});
      setBulkPending(false);
    }
  };

  const allOff = () =>
    runBulk(
      summary.rows.filter((row) => row.isOn === true),
      (row) => (row.control === "position" ? "close_cover" : "turn_off"),
      (row) => (row.control === "position" ? { state: "closed", position: 0 } : { isOn: false }),
    );

  const allOn = () =>
    runBulk(
      summary.rows.filter((row) => row.control !== "position" && row.isOn === false),
      () => "turn_on",
      () => ({ isOn: true }),
    );

  const closeCovers = () =>
    runBulk(
      summary.rows.filter((row) => row.control === "position" && row.isOn === true),
      () => "close_cover",
      () => ({ state: "closed", position: 0 }),
    );

  if (ids.length === 0) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconHome size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{ROOM_EMPTY_COPY}</Text>
        </div>
      </div>
    );
  }

  if (status === 501) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Text className={classes.emptyTitle}>Home Assistant isn't connected</Text>
          <Text size="sm" tone="secondary">
            {error ?? ROOM_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <span className={classes.title}>
          <span className={classes.name}>
            <IconHome size={18} />
            {name.trim() || "Room"}
          </span>
          <span className={classes.summary}>
            {summary.on} on · {summary.open} open
          </span>
        </span>
      </div>

      <div className={classes.actions}>
        <Button appearance="subtle" size="sm" onClick={allOff} disabled={busy || summary.allOff}>
          All off
        </Button>
        <Button
          appearance="subtle"
          size="sm"
          onClick={allOn}
          disabled={
            busy || summary.rows.every((row) => row.control === "position" || row.isOn === true)
          }
        >
          All on
        </Button>
        <Button
          appearance="subtle"
          size="sm"
          onClick={closeCovers}
          disabled={busy || summary.open === 0}
        >
          Close covers
        </Button>
      </div>

      {(error || controlError) && (
        <div className={classes.errorBox}>
          <ErrorText size="sm">{controlError ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      )}

      {summary.rows.length === 0 ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            {isLoading ? "Loading…" : "No matching entities."}
          </Text>
        </div>
      ) : (
        <div className={classes.list}>
          {summary.rows.map((row) => {
            const pending = pendingId === row.entityId;
            const Icon = roomIcon(row);
            return (
              <div
                key={row.entityId}
                className={`${classes.row} ${pending ? classes.rowPending : ""} ${
                  row.available ? "" : classes.rowUnavailable
                }`}
              >
                <span className={classes.rowIcon}>
                  <Icon size={18} />
                </span>
                <span className={classes.details}>
                  <span className={classes.rowName}>{row.name}</span>
                  <span className={classes.rowState}>
                    {row.stateLabel}
                    {row.control === "position" && row.position !== null
                      ? ` · ${Math.round(row.position)}%`
                      : ""}
                  </span>
                </span>
                <span className={classes.rowActions}>
                  {row.control === "position" ? (
                    <>
                      <Button
                        appearance="subtle"
                        size="sm"
                        aria-label={`Open ${row.name}`}
                        onClick={() => void run(row.entityId, "open_cover", {}, { state: "open" })}
                        disabled={busy || !row.available}
                      >
                        <IconChevronUp size={14} />
                      </Button>
                      <Button
                        appearance="subtle"
                        size="sm"
                        aria-label={`Close ${row.name}`}
                        onClick={() =>
                          void run(
                            row.entityId,
                            "close_cover",
                            {},
                            { state: "closed", position: 0 },
                          )
                        }
                        disabled={busy || !row.available}
                      >
                        <IconChevronDown size={14} />
                      </Button>
                    </>
                  ) : (
                    <Button
                      appearance="subtle"
                      size="sm"
                      aria-label={`Toggle ${row.name}`}
                      onClick={() =>
                        void run(
                          row.entityId,
                          row.isOn ? "turn_off" : "turn_on",
                          {},
                          { isOn: !row.isOn },
                        )
                      }
                      disabled={busy || !row.available}
                    >
                      <IconPower size={14} />
                      {row.isOn ? "Off" : "On"}
                    </Button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

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

export function RoomWidgetSettings({ widget, onConfigChange }: WidgetProps<RoomConfig>) {
  const { name = "", entityIds = [], transparentBackground = false } = widget.config;

  return (
    <Stack gap="md">
      <TextField
        label="Room name"
        placeholder="Living room"
        value={name}
        onValueChange={(value) => onConfigChange({ name: value })}
      />
      <Text size="xs" tone="secondary">
        Manual room grouping for now. Pick the lights, switches, and covers in this room.
      </Text>
      <AddEntitySelect
        domains={["light", "switch", "cover"]}
        value={entityIds}
        onAdd={(entityId) => onConfigChange({ entityIds: [...entityIds, entityId] })}
        failureCopy={ROOM_MISSING_CONFIG_COPY}
        label="Add room entity"
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

import { Button, HStack, Stack, Switch, Text } from "@var-ui/react";
import { IconCheck, IconDownload, IconRefresh } from "@tabler/icons-react";
import { useState } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntityList, useHomeAssistantService } from "../hooks/useHomeAssistant";
import { AddEntitySelect, SelectedEntityRow } from "./AddEntitySelect";
import {
  UPDATES_EMPTY_COPY,
  UPDATES_MISSING_CONFIG_COPY,
  UPDATES_UP_TO_DATE_COPY,
  updateIsAvailable,
  updateProgressPct,
  updateStateLabel,
  updateVersionLabel,
  type HomeAssistantUpdate,
} from "./homeAssistantUpdate";
import * as classes from "./UpdatesWidget.styles";
import { ErrorText } from "../ErrorText";

export interface UpdatesConfig extends WidgetConfig {
  entityIds: string[];
  showUpToDate: boolean;
  transparentBackground: boolean;
}

type UpdateOverride = Partial<
  Pick<HomeAssistantUpdate, "state" | "inProgress" | "updatePercentage">
>;

function updateTone(update: HomeAssistantUpdate): string {
  if (!update.available) return "var(--var-ui-color-text-secondary)";
  if (update.inProgress || updateIsAvailable(update)) {
    return "var(--var-ui-color-tone-warning-foreground)";
  }
  return "var(--var-ui-color-tone-success-foreground)";
}

export function UpdatesWidget({ widget, isEditing }: WidgetProps<UpdatesConfig>) {
  const { entityIds = [], showUpToDate = true, transparentBackground = false } = widget.config;
  const ids = entityIds.filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } =
    useEntityList<HomeAssistantUpdate>(ids, {
      fetchFailureCopy: UPDATES_MISSING_CONFIG_COPY,
    });
  const callService = useHomeAssistantService(UPDATES_MISSING_CONFIG_COPY);
  const [overrides, setOverrides] = useState<Record<string, UpdateOverride>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  const byId = new Map(entities.map((entity) => [entity.entityId, entity]));
  const merged = (entityId: string): HomeAssistantUpdate | null => {
    const base = byId.get(entityId);
    if (!base) return null;
    return { ...base, ...overrides[entityId] };
  };
  const updates = ids.flatMap((entityId) => {
    const update = merged(entityId);
    return update && (showUpToDate || updateIsAvailable(update)) ? [update] : [];
  });

  const run = async (update: HomeAssistantUpdate, service: string, optimistic: UpdateOverride) => {
    if (!update.available || pendingId === update.entityId) return;
    setControlError(null);
    setPendingId(update.entityId);
    setOverrides((prev) => ({ ...prev, [update.entityId]: optimistic }));
    try {
      await callService("update", service, update.entityId, {});
    } catch (err) {
      setControlError(err instanceof Error ? err.message : UPDATES_MISSING_CONFIG_COPY);
    } finally {
      await refresh();
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[update.entityId];
        return next;
      });
      setPendingId(null);
    }
  };

  if (ids.length === 0) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconDownload size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{UPDATES_EMPTY_COPY}</Text>
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
            {error ?? UPDATES_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {(error || controlError) && (
        <div className={classes.errorBox}>
          <ErrorText size="sm">{controlError ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      )}

      {updates.length === 0 ? (
        <div className={classes.empty}>
          <IconCheck size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{UPDATES_UP_TO_DATE_COPY}</Text>
        </div>
      ) : (
        <div className={classes.list}>
          {updates.map((update) => {
            const pending = pendingId === update.entityId;
            const progress = updateProgressPct(update);
            const version = updateVersionLabel(update);
            const available = updateIsAvailable(update);
            return (
              <div
                key={update.entityId}
                className={`${classes.row} ${pending ? classes.rowPending : ""} ${
                  update.available ? "" : classes.rowUnavailable
                }`}
              >
                <div className={classes.rowTop}>
                  <span className={classes.rowIcon}>
                    {available ? <IconDownload size={18} /> : <IconCheck size={18} />}
                  </span>
                  <span className={classes.details}>
                    <span className={classes.name}>{update.name}</span>
                    <span className={classes.state} style={{ color: updateTone(update) }}>
                      {updateStateLabel(update)}
                    </span>
                    {version && <span className={classes.version}>{version}</span>}
                  </span>
                </div>

                {progress !== null && (
                  <div className={classes.progressTrack}>
                    <div className={classes.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                )}

                {available && !update.inProgress && (
                  <div className={classes.actions}>
                    <Button
                      appearance="subtle"
                      size="sm"
                      onClick={() =>
                        void run(update, "install", { inProgress: true, updatePercentage: 0 })
                      }
                      disabled={pending}
                    >
                      Install
                    </Button>
                    <Button
                      appearance="subtle"
                      size="sm"
                      onClick={() =>
                        void run(update, "skip", {
                          state: "off",
                          inProgress: false,
                          updatePercentage: null,
                        })
                      }
                      disabled={pending}
                    >
                      Skip
                    </Button>
                  </div>
                )}
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

export function UpdatesWidgetSettings({ widget, onConfigChange }: WidgetProps<UpdatesConfig>) {
  const { entityIds = [], showUpToDate = true, transparentBackground = false } = widget.config;

  return (
    <Stack gap="md">
      <AddEntitySelect
        domains={["update"]}
        value={entityIds}
        onAdd={(entityId) => onConfigChange({ entityIds: [...entityIds, entityId] })}
        failureCopy={UPDATES_MISSING_CONFIG_COPY}
        label="Add update"
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
        <Text size="sm">Show up-to-date entities</Text>
        <Switch
          aria-label="Show up-to-date entities"
          checked={showUpToDate}
          onCheckedChange={(value) => onConfigChange({ showUpToDate: value })}
        />
      </HStack>
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

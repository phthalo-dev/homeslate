import { Button, HStack, Stack, Switch, Text } from "@var-ui/react";
import {
  IconLock,
  IconLockOpen,
  IconRefresh,
  IconShieldCheck,
  IconShieldLock,
  IconShieldOff,
} from "@tabler/icons-react";
import { useState } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntityList, useHomeAssistantService } from "../hooks/useHomeAssistant";
import { AddEntitySelect, SelectedEntityRow } from "./AddEntitySelect";
import {
  SECURITY_EMPTY_COPY,
  SECURITY_MISSING_CONFIG_COPY,
  lockNeedsConfirm,
  lockStateLabel,
  lockSupportsOpen,
  lockTone,
  type HomeAssistantLock,
  type SecurityTone,
} from "./homeAssistantLock";
import {
  alarmArmOptions,
  alarmIsArmed,
  alarmNeedsDisarmConfirm,
  alarmStateLabel,
  alarmTone,
  type HomeAssistantAlarm,
} from "./homeAssistantAlarm";
import * as classes from "./SecurityWidget.styles";
import { securityHighRiskLocked } from "./securityControls";
import { ErrorText } from "../ErrorText";

export interface SecurityConfig extends WidgetConfig {
  entityIds: string[];
  transparentBackground: boolean;
}

type SecurityEntity = HomeAssistantLock | HomeAssistantAlarm;

function toneColor(tone: SecurityTone): string {
  switch (tone) {
    case "success":
      return "var(--var-ui-color-tone-success-foreground)";
    case "danger":
      return "var(--var-ui-color-tone-danger-foreground)";
    case "warning":
      return "var(--var-ui-color-tone-warning-foreground)";
    default:
      return "var(--var-ui-color-text-secondary)";
  }
}

function confirmAction(message: string): boolean {
  if (typeof window === "undefined") return true;
  return window.confirm(message);
}

export function SecurityWidget({ widget, isEditing }: WidgetProps<SecurityConfig>) {
  const { entityIds = [], transparentBackground = false } = widget.config;
  const ids = entityIds.filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } =
    useEntityList<SecurityEntity>(ids, { fetchFailureCopy: SECURITY_MISSING_CONFIG_COPY });
  const callService = useHomeAssistantService(SECURITY_MISSING_CONFIG_COPY);
  const highRiskLocked = securityHighRiskLocked(lastUpdated);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);

  const byId = new Map(entities.map((entity) => [entity.entityId, entity]));
  const merged = (entityId: string): SecurityEntity | null => {
    const base = byId.get(entityId);
    if (!base) return null;
    const state = overrides[entityId];
    return state ? { ...base, state } : base;
  };

  const run = async (entity: SecurityEntity, service: string, optimisticState: string) => {
    if (!entity.available || pendingId === entity.entityId) return;
    setControlError(null);
    setPendingId(entity.entityId);
    setOverrides((prev) => ({ ...prev, [entity.entityId]: optimisticState }));
    try {
      await callService(
        entity.kind === "lock" ? "lock" : "alarm_control_panel",
        service,
        entity.entityId,
        {},
      );
    } catch (err) {
      setControlError(err instanceof Error ? err.message : SECURITY_MISSING_CONFIG_COPY);
    } finally {
      await refresh();
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[entity.entityId];
        return next;
      });
      setPendingId(null);
    }
  };

  const unlock = (lock: HomeAssistantLock) => {
    if (lockNeedsConfirm(lock, "unlock") && !confirmAction(`Unlock ${lock.name}?`)) return;
    void run(lock, "unlock", "unlocking");
  };

  const open = (lock: HomeAssistantLock) => {
    if (!confirmAction(`Unlatch ${lock.name}? The door will be open.`)) return;
    void run(lock, "open", "opening");
  };

  const disarm = (alarm: HomeAssistantAlarm) => {
    if (alarmNeedsDisarmConfirm(alarm) && !confirmAction(`Disarm ${alarm.name}?`)) return;
    void run(alarm, "alarm_disarm", "disarming");
  };

  if (ids.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconShieldLock size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{SECURITY_EMPTY_COPY}</Text>
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
            {error ?? SECURITY_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {highRiskLocked && (
        <div className={classes.errorBox}>
          <Text size="sm" tone="secondary">
            Refresh to unlock or disarm
          </Text>
          <Button appearance="subtle" size="sm" onClick={() => void refresh()} disabled={isLoading}>
            <IconRefresh size={14} />
            Refresh
          </Button>
        </div>
      )}
      {(error || controlError) && (
        <div className={classes.errorBox}>
          <ErrorText size="sm">{controlError ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      )}

      <div className={classes.list}>
        {ids.map((entityId) => {
          const entity = merged(entityId);
          if (!entity) {
            return (
              <div key={entityId} className={classes.row}>
                <Text size="sm" tone="secondary">
                  Loading…
                </Text>
              </div>
            );
          }
          const pending = pendingId === entity.entityId;
          const tone = entity.kind === "lock" ? lockTone(entity) : alarmTone(entity);
          const label = entity.kind === "lock" ? lockStateLabel(entity) : alarmStateLabel(entity);
          const Icon =
            entity.kind === "lock"
              ? entity.isLocked
                ? IconLock
                : IconLockOpen
              : alarmIsArmed(entity)
                ? IconShieldCheck
                : IconShieldOff;
          return (
            <div
              key={entityId}
              className={`${classes.row} ${pending ? classes.rowPending : ""} ${
                entity.available ? "" : classes.rowUnavailable
              }`}
            >
              <div className={classes.rowTop}>
                <span className={classes.rowIcon}>
                  <Icon size={20} />
                </span>
                <span className={classes.details}>
                  <span className={classes.name}>{entity.name}</span>
                  <span className={classes.state}>
                    <span className={classes.dot} style={{ background: toneColor(tone) }} />
                    <Text size="sm" style={{ color: toneColor(tone) }}>
                      {label}
                    </Text>
                  </span>
                </span>
              </div>

              {entity.kind === "lock" ? (
                <div className={classes.actions}>
                  {entity.isLocked ? (
                    <Button
                      appearance="subtle"
                      size="sm"
                      onClick={() => unlock(entity)}
                      disabled={!entity.available || pending || highRiskLocked}
                    >
                      Unlock
                    </Button>
                  ) : (
                    <Button
                      appearance="subtle"
                      size="sm"
                      onClick={() => void run(entity, "lock", "locking")}
                      disabled={!entity.available || pending}
                    >
                      Lock
                    </Button>
                  )}
                  {lockSupportsOpen(entity) && (
                    <Button
                      appearance="subtle"
                      size="sm"
                      onClick={() => open(entity)}
                      disabled={!entity.available || pending || highRiskLocked}
                    >
                      Open
                    </Button>
                  )}
                </div>
              ) : (
                <div className={classes.actions}>
                  {alarmArmOptions(entity.supportedFeatures).map((option) => {
                    const current = entity.state === `armed_${option.mode}`;
                    return (
                      <Button
                        key={option.mode}
                        appearance="subtle"
                        size="sm"
                        onClick={() => void run(entity, option.service, "arming")}
                        disabled={!entity.available || pending || current}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                  <Button
                    appearance="subtle"
                    size="sm"
                    onClick={() => disarm(entity)}
                    disabled={
                      !entity.available || pending || entity.state === "disarmed" || highRiskLocked
                    }
                  >
                    Disarm
                  </Button>
                </div>
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

export function SecurityWidgetSettings({ widget, onConfigChange }: WidgetProps<SecurityConfig>) {
  const { entityIds = [], transparentBackground = false } = widget.config;

  return (
    <Stack gap="md">
      <AddEntitySelect
        domains={["lock", "alarm_control_panel"]}
        value={entityIds}
        onAdd={(entityId) => onConfigChange({ entityIds: [...entityIds, entityId] })}
        failureCopy={SECURITY_MISSING_CONFIG_COPY}
        label="Add lock or alarm panel"
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

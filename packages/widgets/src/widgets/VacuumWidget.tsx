import { Button, HStack, Select, Spinner, Stack, Switch, Text } from "@var-ui/react";
import {
  IconBattery3,
  IconHome,
  IconMapPin,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconRobot,
  IconSparkles,
} from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntities, useEntity } from "../hooks/useHomeAssistant";
import {
  VACUUM_EMPTY_COPY,
  VACUUM_FEATURE,
  VACUUM_MISSING_CONFIG_COPY,
  getVacuumSizeTier,
  vacuumBatteryLabel,
  vacuumStateLabel,
  vacuumSupports,
  type HomeAssistantVacuum,
} from "./homeAssistantVacuum";
import * as classes from "./VacuumWidget.styles";
import { ErrorText } from "../ErrorText";

export interface VacuumConfig extends WidgetConfig {
  entityId: string;
  showFanSpeed: boolean;
  transparentBackground: boolean;
}

export function VacuumWidget({ widget, isEditing }: WidgetProps<VacuumConfig>) {
  const { entityId = "", showFanSpeed = true, transparentBackground = false } = widget.config;
  const {
    entity: vacuum,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
    call,
  } = useEntity<HomeAssistantVacuum>(entityId, {
    domain: "vacuum",
    fetchFailureCopy: VACUUM_MISSING_CONFIG_COPY,
    callFailureCopy: VACUUM_MISSING_CONFIG_COPY,
  });
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconRobot size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{VACUUM_EMPTY_COPY}</Text>
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
            {error ?? VACUUM_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !vacuum) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!vacuum) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? "Failed to fetch vacuum"}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!vacuum.available) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconRobot size={32} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            Unavailable
          </Text>
        </div>
      </div>
    );
  }

  const tier = getVacuumSizeTier(widget.layout.w, widget.layout.h);
  const battery = vacuumBatteryLabel(vacuum);
  const canPause = vacuumSupports(vacuum, VACUUM_FEATURE.pause);
  const canStop = vacuumSupports(vacuum, VACUUM_FEATURE.stop);
  const canDock = vacuumSupports(vacuum, VACUUM_FEATURE.returnHome);
  const canLocate = vacuumSupports(vacuum, VACUUM_FEATURE.locate);
  const canSpot = vacuumSupports(vacuum, VACUUM_FEATURE.cleanSpot);
  const canFanSpeed =
    tier === "full" &&
    showFanSpeed &&
    vacuumSupports(vacuum, VACUUM_FEATURE.fanSpeed) &&
    vacuum.fanSpeedList.length > 0;

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconRobot size={18} />
          {tier === "compact" ? "Vacuum" : vacuum.name}
        </Text>
        {battery && (
          <span className={classes.battery}>
            <IconBattery3 size={16} />
            {battery}
          </span>
        )}
      </div>

      <div className={classes.stateRow}>
        <Text className={classes.stateLabel}>{vacuumStateLabel(vacuum)}</Text>
        {vacuum.fanSpeed && (
          <Text size="sm" tone="secondary">
            {vacuum.fanSpeed}
          </Text>
        )}
      </div>

      <div className={classes.actions}>
        <Button
          appearance="subtle"
          size="sm"
          onClick={() => void call("start", {}, (current) => ({ ...current, state: "cleaning" }))}
          disabled={pending}
        >
          <IconPlayerPlay size={16} />
          {vacuum.state === "paused" ? "Resume" : "Start"}
        </Button>
        {canPause && (
          <Button
            appearance="subtle"
            size="sm"
            onClick={() => void call("pause", {}, (current) => ({ ...current, state: "paused" }))}
            disabled={pending}
          >
            <IconPlayerPause size={16} />
            Pause
          </Button>
        )}
        {canStop && tier !== "compact" && (
          <Button
            appearance="subtle"
            size="sm"
            onClick={() => void call("stop", {}, (current) => ({ ...current, state: "idle" }))}
            disabled={pending}
          >
            <IconPlayerStop size={16} />
            Stop
          </Button>
        )}
        {canDock && (
          <Button
            appearance="subtle"
            size="sm"
            onClick={() =>
              void call("return_to_base", {}, (current) => ({
                ...current,
                state: "returning",
              }))
            }
            disabled={pending}
          >
            <IconHome size={16} />
            Dock
          </Button>
        )}
        {tier !== "compact" && canLocate && (
          <Button
            appearance="subtle"
            size="sm"
            onClick={() => void call("locate", {}, undefined)}
            disabled={pending}
          >
            <IconMapPin size={16} />
            Locate
          </Button>
        )}
        {tier !== "compact" && canSpot && (
          <Button
            appearance="subtle"
            size="sm"
            onClick={() =>
              void call("clean_spot", {}, (current) => ({ ...current, state: "cleaning" }))
            }
            disabled={pending}
          >
            <IconSparkles size={16} />
            Spot
          </Button>
        )}
      </div>

      {canFanSpeed && (
        <Select
          label="Fan speed"
          options={vacuum.fanSpeedList.map((speed) => ({ value: speed, label: speed }))}
          value={vacuum.fanSpeed}
          onValueChange={(key) => {
            if (typeof key === "string" && key !== vacuum.fanSpeed) {
              void call("set_fan_speed", { fan_speed: key }, (current) => ({
                ...current,
                fanSpeed: key,
              }));
            }
          }}
        />
      )}

      {(controlError || error) && (
        <div className={classes.errorBox}>
          <ErrorText size="xs">{controlError ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
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

export function VacuumWidgetSettings({ widget, onConfigChange }: WidgetProps<VacuumConfig>) {
  const { entityId = "", showFanSpeed = true, transparentBackground = false } = widget.config;
  const { entities, isLoading, error, status, refresh } = useEntities(
    "vacuum",
    VACUUM_MISSING_CONFIG_COPY,
  );

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{VACUUM_MISSING_CONFIG_COPY}</Text>
      ) : (
        <HStack gap="xs" align="end">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Select
              label="Vacuum"
              placeholder="Select a vacuum…"
              options={entities.map((entity) => ({
                value: entity.entityId,
                label: `${entity.name} (${entity.entityId})`,
              }))}
              value={entityId || null}
              onValueChange={(key) => {
                if (typeof key === "string") onConfigChange({ entityId: key });
              }}
            />
          </div>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
          </Button>
        </HStack>
      )}

      {error && status !== 501 && <ErrorText size="xs">{error}</ErrorText>}

      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show fan speed</Text>
        <Switch
          aria-label="Show fan speed"
          checked={showFanSpeed}
          onCheckedChange={(value) => onConfigChange({ showFanSpeed: value })}
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

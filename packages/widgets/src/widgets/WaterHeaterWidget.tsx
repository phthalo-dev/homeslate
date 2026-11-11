import { Button, HStack, Select, Spinner, Stack, Switch, Text } from "@var-ui/react";
import { IconFlame, IconMinus, IconPlus, IconPower, IconRefresh } from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntities, useEntity } from "../hooks/useHomeAssistant";
import {
  WATER_HEATER_EMPTY_COPY,
  WATER_HEATER_MISSING_CONFIG_COPY,
  clampWaterHeaterTemperature,
  getWaterHeaterSizeTier,
  waterHeaterModeLabel,
  waterHeaterStateLabel,
  waterHeaterTemperatureLabel,
  type HomeAssistantWaterHeater,
} from "./homeAssistantWaterHeater";
import * as classes from "./ClimateAuxWidget.styles";
import { ErrorText } from "../ErrorText";

export interface WaterHeaterConfig extends WidgetConfig {
  entityId: string;
  showMode: boolean;
  transparentBackground: boolean;
}

export function WaterHeaterWidget({ widget, isEditing }: WidgetProps<WaterHeaterConfig>) {
  const { entityId = "", showMode = true, transparentBackground = false } = widget.config;
  const {
    entity: waterHeater,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
    call,
  } = useEntity<HomeAssistantWaterHeater>(entityId, {
    domain: "water_heater",
    fetchFailureCopy: WATER_HEATER_MISSING_CONFIG_COPY,
    callFailureCopy: WATER_HEATER_MISSING_CONFIG_COPY,
  });
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconFlame size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{WATER_HEATER_EMPTY_COPY}</Text>
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
            {error ?? WATER_HEATER_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !waterHeater) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!waterHeater) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? "Failed to fetch water heater"}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!waterHeater.available) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconFlame size={32} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            Unavailable
          </Text>
        </div>
      </div>
    );
  }

  const tier = getWaterHeaterSizeTier(widget.layout.w, widget.layout.h);
  const adjust = (delta: number) => {
    const base =
      waterHeater.targetTemperature ??
      waterHeater.currentTemperature ??
      (waterHeater.minTemp + waterHeater.maxTemp) / 2;
    const next = clampWaterHeaterTemperature(
      base + delta,
      waterHeater.minTemp,
      waterHeater.maxTemp,
    );
    const snapped = Math.round(next / waterHeater.step) * waterHeater.step;
    const temperature = clampWaterHeaterTemperature(
      Number(snapped.toFixed(6)),
      waterHeater.minTemp,
      waterHeater.maxTemp,
    );
    void call("set_temperature", { temperature }, (current) => ({
      ...current,
      targetTemperature: temperature,
    }));
  };

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconFlame size={18} />
          {tier === "compact" ? "Water heater" : waterHeater.name}
        </Text>
        <Button
          appearance="subtle"
          size="sm"
          aria-label={waterHeater.isOn ? "Turn off" : "Turn on"}
          onClick={() =>
            void call(waterHeater.isOn ? "turn_off" : "turn_on", {}, (current) => ({
              ...current,
              isOn: !current.isOn,
            }))
          }
          disabled={pending}
        >
          <IconPower size={16} />
          {waterHeater.isOn ? "On" : "Off"}
        </Button>
      </div>

      <div className={classes.reading}>
        <Text className={classes.value}>
          {waterHeater.currentTemperature === null
            ? "—"
            : `${Math.round(waterHeater.currentTemperature * 10) / 10}${waterHeater.unit}`}
        </Text>
        <Text size="xs" tone="secondary">
          Current · {waterHeaterStateLabel(waterHeater)}
        </Text>
      </div>

      <div className={classes.targetRow}>
        <span className={classes.targetLabel}>Target temperature</span>
        <div className={classes.targetControls}>
          <Button
            appearance="subtle"
            size="sm"
            aria-label="Lower temperature"
            onClick={() => adjust(-waterHeater.step)}
            disabled={pending}
          >
            <IconMinus size={16} />
          </Button>
          <Text className={classes.targetValue}>{waterHeaterTemperatureLabel(waterHeater)}</Text>
          <Button
            appearance="subtle"
            size="sm"
            aria-label="Raise temperature"
            onClick={() => adjust(waterHeater.step)}
            disabled={pending}
          >
            <IconPlus size={16} />
          </Button>
        </div>
      </div>

      {showMode && tier !== "compact" && waterHeater.operationModes.length > 0 && (
        <div className={classes.modes}>
          <Select
            label="Operation mode"
            options={waterHeater.operationModes.map((mode) => ({
              value: mode,
              label: waterHeaterModeLabel(mode),
            }))}
            value={waterHeater.operationMode}
            onValueChange={(key) => {
              if (typeof key === "string" && key !== waterHeater.operationMode) {
                void call("set_operation_mode", { operation_mode: key }, (current) => ({
                  ...current,
                  operationMode: key,
                }));
              }
            }}
          />
        </div>
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

export function WaterHeaterWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<WaterHeaterConfig>) {
  const { entityId = "", showMode = true, transparentBackground = false } = widget.config;
  const { entities, isLoading, error, status, refresh } = useEntities(
    "water_heater",
    WATER_HEATER_MISSING_CONFIG_COPY,
  );

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{WATER_HEATER_MISSING_CONFIG_COPY}</Text>
      ) : (
        <HStack gap="xs" align="end">
          <div className={classes.fieldGrow}>
            <Select
              label="Water heater"
              placeholder="Select a water heater…"
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
        <Text size="sm">Show operation mode picker</Text>
        <Switch
          aria-label="Show operation mode picker"
          checked={showMode}
          onCheckedChange={(value) => onConfigChange({ showMode: value })}
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

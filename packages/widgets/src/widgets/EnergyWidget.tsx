import { Button, HStack, NumberInput, Select, Stack, Switch, Text } from "@var-ui/react";
import { IconBolt, IconCurrencyDollar, IconRefresh, IconTrendingUp } from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntities, useEntityList } from "../hooks/useHomeAssistant";
import type { HomeAssistantSensor } from "./homeAssistantSensor";
import {
  ENERGY_EMPTY_COPY,
  ENERGY_MISSING_CONFIG_COPY,
  calculateEnergyCost,
  formatCost,
  formatEnergy,
  formatPower,
  normalizeEnergyKwh,
} from "./energy";
import * as classes from "./EnergyWidget.styles";
import { ErrorText } from "../ErrorText";

export interface EnergyConfig extends WidgetConfig {
  powerEntityId: string;
  energyEntityId: string;
  costRate: number;
  showCost: boolean;
  transparentBackground: boolean;
}

export function EnergyWidget({ widget, isEditing }: WidgetProps<EnergyConfig>) {
  const {
    powerEntityId = "",
    energyEntityId = "",
    costRate = 0,
    showCost = true,
    transparentBackground = false,
  } = widget.config;
  const ids = [powerEntityId, energyEntityId].filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } =
    useEntityList<HomeAssistantSensor>(ids, {
      fetchFailureCopy: ENERGY_MISSING_CONFIG_COPY,
    });
  const byId = new Map(entities.map((entity) => [entity.entityId, entity]));
  const powerSensor = byId.get(powerEntityId);
  const energySensor = byId.get(energyEntityId);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!powerEntityId && !energyEntityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconBolt size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{ENERGY_EMPTY_COPY}</Text>
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
            {error ?? ENERGY_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  const energyKwh = normalizeEnergyKwh(
    energySensor?.numericValue ?? null,
    energySensor?.unit ?? null,
  );
  const cost = calculateEnergyCost(energyKwh, costRate);
  const showCostCard = showCost && costRate > 0;

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconBolt size={18} />
          Energy
        </Text>
      </div>

      <div className={classes.values}>
        <div className={classes.valueCard}>
          <span className={classes.valueLabel}>
            <IconBolt size={14} />
            Now
          </span>
          <span className={classes.value}>
            {formatPower(powerSensor?.numericValue ?? null, powerSensor?.unit ?? null)}
          </span>
        </div>
        <div className={classes.valueCard}>
          <span className={classes.valueLabel}>
            <IconTrendingUp size={14} />
            Today
          </span>
          <span className={classes.value}>
            {formatEnergy(energySensor?.numericValue ?? null, energySensor?.unit ?? null)}
          </span>
        </div>
        {showCostCard && (
          <div className={classes.valueCard}>
            <span className={classes.valueLabel}>
              <IconCurrencyDollar size={14} />
              Cost
            </span>
            <span className={classes.value}>{formatCost(cost)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className={classes.errorBox}>
          <ErrorText size="xs">{error}</ErrorText>
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

export function EnergyWidgetSettings({ widget, onConfigChange }: WidgetProps<EnergyConfig>) {
  const {
    powerEntityId = "",
    energyEntityId = "",
    costRate = 0,
    showCost = true,
    transparentBackground = false,
  } = widget.config;
  const { entities, isLoading, error, status, refresh } = useEntities(
    "sensor",
    ENERGY_MISSING_CONFIG_COPY,
  );

  const options = entities.map((entity) => ({
    value: entity.entityId,
    label: `${entity.name} (${entity.entityId})`,
  }));

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{ENERGY_MISSING_CONFIG_COPY}</Text>
      ) : (
        <>
          <HStack gap="xs" align="end">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Select
                label="Power sensor (W or kW)"
                placeholder="Select a power sensor…"
                options={options}
                value={powerEntityId || null}
                onValueChange={(key) => {
                  if (typeof key === "string") onConfigChange({ powerEntityId: key });
                }}
              />
            </div>
            <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
              <IconRefresh size={14} />
            </Button>
          </HStack>
          <Select
            label="Energy sensor (Wh or kWh)"
            placeholder="Select an energy sensor…"
            options={options}
            value={energyEntityId || null}
            onValueChange={(key) => {
              if (typeof key === "string") onConfigChange({ energyEntityId: key });
            }}
          />
        </>
      )}

      {error && status !== 501 && <ErrorText size="xs">{error}</ErrorText>}

      <NumberInput
        label="Cost rate ($ per kWh)"
        min={0}
        value={costRate}
        onValueChange={(value) => {
          const next = Number(value);
          onConfigChange({ costRate: Number.isFinite(next) ? Math.max(0, next) : 0 });
        }}
      />
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show estimated cost</Text>
        <Switch
          aria-label="Show estimated cost"
          checked={showCost}
          onCheckedChange={(value) => onConfigChange({ showCost: value })}
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

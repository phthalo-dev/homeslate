import {
  Button,
  HStack,
  NumberInput,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import { IconGauge, IconRefresh } from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntityList } from "../hooks/useHomeAssistant";
import { AddEntitySelect, SelectedEntityRow } from "./AddEntitySelect";
import {
  SENSORS_EMPTY_COPY,
  SENSORS_MISSING_CONFIG_COPY,
  binarySensorLabel,
  formatSensorValue,
  type HomeAssistantSensor,
} from "./homeAssistantSensor";
import * as classes from "./SensorsWidget.styles";
import { ErrorText } from "../ErrorText";

export interface SensorItem {
  entityId: string;
  label?: string;
  /** Optional gauge range; both must be set for the bar to render. */
  min?: number;
  max?: number;
}

export interface SensorsConfig extends WidgetConfig {
  items: SensorItem[];
  layout: "list" | "grid";
  showGauge: boolean;
  transparentBackground: boolean;
}

const SENSOR_DOMAINS = ["sensor", "binary_sensor", "number", "input_number"];

function isBinary(entityId: string): boolean {
  return entityId.startsWith("binary_sensor.");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function SensorsWidget({ widget, isEditing }: WidgetProps<SensorsConfig>) {
  const {
    items = [],
    layout = "list",
    showGauge = true,
    transparentBackground = false,
  } = widget.config;
  const entityIds = items.map((item) => item.entityId).filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } =
    useEntityList<HomeAssistantSensor>(entityIds, {
      fetchFailureCopy: SENSORS_MISSING_CONFIG_COPY,
    });
  const byId = new Map(entities.map((entity) => [entity.entityId, entity]));
  const grid = layout === "grid";

  if (items.length === 0) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconGauge size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{SENSORS_EMPTY_COPY}</Text>
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
            {error ?? SENSORS_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {error && !lastUpdated && (
        <div className={classes.errorBox}>
          <ErrorText size="sm">{error}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      )}
      <div className={grid ? classes.grid : classes.list}>
        {items.map((item) => {
          const sensor = byId.get(item.entityId);
          const label = item.label?.trim() || sensor?.name || item.entityId;
          const binary = isBinary(item.entityId);
          const value = sensor
            ? binary
              ? binarySensorLabel(sensor.deviceClass, sensor.isOn)
              : formatSensorValue(sensor)
            : "—";
          const gauge =
            showGauge &&
            !binary &&
            sensor?.numericValue != null &&
            item.min != null &&
            item.max != null &&
            item.max > item.min;
          const percent = gauge
            ? clamp(((sensor.numericValue! - item.min!) / (item.max! - item.min!)) * 100, 0, 100)
            : 0;

          return (
            <div key={item.entityId} className={classes.row}>
              <div className={classes.rowTop}>
                <Text size="sm" tone="secondary" className={classes.rowLabel}>
                  {label}
                </Text>
                <HStack gap="xs" align="center">
                  {binary && sensor && (
                    <span
                      className={classes.binaryDot}
                      style={{
                        background: sensor.isOn
                          ? "var(--var-ui-color-tone-success-foreground)"
                          : "var(--var-ui-color-text-secondary)",
                      }}
                    />
                  )}
                  <Text className={classes.rowValue} size={grid ? "sm" : "md"}>
                    {value}
                  </Text>
                </HStack>
              </div>
              {gauge && (
                <div className={classes.gaugeTrack}>
                  <div className={classes.gaugeFill} style={{ width: `${percent}%` }} />
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

export function SensorsSettings({ widget, onConfigChange }: WidgetProps<SensorsConfig>) {
  const {
    items = [],
    layout = "list",
    showGauge = true,
    transparentBackground = false,
  } = widget.config;

  const updateItem = (index: number, patch: Partial<SensorItem>) => {
    onConfigChange({
      items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  };

  return (
    <Stack gap="md">
      <AddEntitySelect
        domains={SENSOR_DOMAINS}
        value={items.map((item) => item.entityId)}
        onAdd={(entityId) => onConfigChange({ items: [...items, { entityId }] })}
        failureCopy={SENSORS_MISSING_CONFIG_COPY}
        label="Add sensor"
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
            onValueChange={(value) => updateItem(index, { label: value })}
          />
          {!isBinary(item.entityId) && (
            <HStack gap="sm">
              <NumberInput
                label="Min"
                value={item.min}
                onValueChange={(value) => {
                  const next = Number(value);
                  updateItem(index, { min: Number.isFinite(next) ? next : undefined });
                }}
              />
              <NumberInput
                label="Max"
                value={item.max}
                onValueChange={(value) => {
                  const next = Number(value);
                  updateItem(index, { max: Number.isFinite(next) ? next : undefined });
                }}
              />
            </HStack>
          )}
        </SelectedEntityRow>
      ))}
      <Stack gap="xs">
        <Text size="sm">Layout</Text>
        <SegmentedControl
          size="sm"
          aria-label="Sensor layout"
          options={[
            { value: "list", label: "List" },
            { value: "grid", label: "Grid" },
          ]}
          value={layout}
          onValueChange={(next) => {
            if (next === "list" || next === "grid") onConfigChange({ layout: next });
          }}
        />
      </Stack>
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show gauge when min/max are set</Text>
        <Switch
          aria-label="Show gauge"
          checked={showGauge}
          onCheckedChange={(value) => onConfigChange({ showGauge: value })}
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

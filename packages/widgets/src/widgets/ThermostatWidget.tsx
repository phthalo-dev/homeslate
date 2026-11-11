import {
  Button,
  HStack,
  SegmentedControl,
  Select,
  Spinner,
  Stack,
  Surface,
  Switch,
  Text,
} from "@var-ui/react";
import {
  IconDroplet,
  IconFlame,
  IconMinus,
  IconPlus,
  IconPower,
  IconRefresh,
  IconSnowflake,
  IconTemperature,
  IconWind,
} from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useClimateEntities, useThermostat } from "../hooks/useThermostat";
import {
  HA_AGENT_OFFLINE_COPY,
  THERMOSTAT_EMPTY_COPY,
  THERMOSTAT_MISSING_CONFIG_COPY,
  THERMOSTAT_UNAVAILABLE_COPY,
  formatTemperature,
  getThermostatSizeTier,
  hvacActionLabel,
  hvacModeLabel,
  isDualSetpoint,
  stepSetpoint,
} from "./homeAssistant";
import * as classes from "./ThermostatWidget.styles";

export interface ThermostatConfig extends WidgetConfig {
  entityId: string;
  showControls: boolean;
  showFanControl: boolean;
  showPresetControl: boolean;
  showSwingControl: boolean;
  showHumidity: boolean;
  transparentBackground: boolean;
}

function ActionIcon({ action }: { action: string | null }) {
  switch (action) {
    case "heating":
    case "preheating":
      return <IconFlame size={16} />;
    case "cooling":
      return <IconSnowflake size={16} />;
    case "fan":
      return <IconWind size={16} />;
    case "off":
      return <IconPower size={16} />;
    default:
      return <IconTemperature size={16} />;
  }
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button appearance="subtle" size="sm" onClick={onClick}>
      <IconRefresh size={14} />
      Retry
    </Button>
  );
}

export function ThermostatWidget({ widget }: WidgetProps<ThermostatConfig>) {
  const {
    entityId = "",
    showControls = true,
    showFanControl = true,
    showPresetControl = true,
    showSwingControl = false,
    showHumidity = true,
    transparentBackground = false,
  } = widget.config;

  const {
    state,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
    setTarget,
    setRange,
    setHvacMode,
    setFanMode,
    setPresetMode,
    setSwingMode,
  } = useThermostat(entityId);

  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconTemperature size={40} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            {THERMOSTAT_EMPTY_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (status === 501) {
    return (
      <div className={containerClass}>
        <div className={classes.header}>
          <Text className={classes.title}>
            <IconTemperature size={18} />
            Thermostat
          </Text>
        </div>
        <Surface className={classes.notice} padding="sm">
          <Text size="sm">{THERMOSTAT_MISSING_CONFIG_COPY}</Text>
        </Surface>
      </div>
    );
  }

  if (status === 503) {
    return (
      <div className={containerClass}>
        <div className={classes.header}>
          <Text className={classes.title}>
            <IconTemperature size={18} />
            Thermostat
          </Text>
        </div>
        <div className={classes.empty}>
          <IconWind size={40} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            {error ?? HA_AGENT_OFFLINE_COPY}
          </Text>
          <RetryButton onClick={refresh} />
        </div>
      </div>
    );
  }

  if (isLoading && !state) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className={containerClass}>
        <div className={classes.error}>
          <Text size="sm" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
            {error ?? "Failed to fetch thermostat"}
          </Text>
          <RetryButton onClick={refresh} />
        </div>
      </div>
    );
  }

  if (state.hvacMode === "unavailable" || state.hvacMode === "unknown") {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconPower size={40} className={classes.emptyIcon} />
          <Text size="sm" weight="medium">
            {THERMOSTAT_UNAVAILABLE_COPY}
          </Text>
          <RetryButton onClick={refresh} />
        </div>
      </div>
    );
  }

  const { w, h } = widget.layout;
  const tier = getThermostatSizeTier(w, h);
  const dual = isDualSetpoint(state);
  const controlsEnabled = showControls && !pending;
  const showModeControl = showControls && state.hvacModes.length > 0;
  const showExtras = tier !== "compact" && showControls;
  const actionLabel = hvacActionLabel(state.action);
  const current =
    state.currentTemperature !== null
      ? formatTemperature(state.currentTemperature, state.unit)
      : "—";

  const adjustSingle = (delta: number) => {
    const base =
      state.targetTemperature ?? state.currentTemperature ?? (state.minTemp + state.maxTemp) / 2;
    void setTarget(stepSetpoint(base, delta, state.minTemp, state.maxTemp, state.step));
  };

  const adjustRange = (which: "low" | "high", delta: number) => {
    const low = stepSetpoint(
      state.targetTemperatureLow ?? state.minTemp,
      which === "low" ? delta : 0,
      state.minTemp,
      state.maxTemp,
      state.step,
    );
    const high = stepSetpoint(
      state.targetTemperatureHigh ?? state.maxTemp,
      which === "high" ? delta : 0,
      state.minTemp,
      state.maxTemp,
      state.step,
    );
    void setRange(Math.min(low, high), Math.max(low, high));
  };

  const targetRow = (label: string, value: number | null, onAdjust: (delta: number) => void) => (
    <div className={classes.targetRow} key={label}>
      <Text size="sm" className={classes.targetLabel}>
        {label}
      </Text>
      <div className={classes.targetControls}>
        {showControls && (
          <Button
            appearance="subtle"
            size="sm"
            aria-label={`Lower ${label.toLowerCase()}`}
            disabled={!controlsEnabled}
            onClick={() => onAdjust(-state.step)}
          >
            <IconMinus size={16} />
          </Button>
        )}
        <Text className={classes.targetValue}>
          {value !== null ? formatTemperature(value, state.unit) : "—"}
        </Text>
        {showControls && (
          <Button
            appearance="subtle"
            size="sm"
            aria-label={`Raise ${label.toLowerCase()}`}
            disabled={!controlsEnabled}
            onClick={() => onAdjust(state.step)}
          >
            <IconPlus size={16} />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconTemperature size={18} />
          {tier === "compact" ? "Thermostat" : state.name}
        </Text>
        {actionLabel && (
          <div className={classes.action}>
            <ActionIcon action={state.action} />
            <Text size="sm">{actionLabel}</Text>
          </div>
        )}
        {isLoading && <Spinner size="sm" />}
      </div>

      <div className={classes.reading}>
        <Text className={classes.currentTemp}>{current}</Text>
        {showHumidity && state.currentHumidity !== null && (
          <div className={classes.humidity}>
            <IconDroplet size={14} />
            <Text size="sm">{Math.round(state.currentHumidity)}%</Text>
          </div>
        )}
      </div>

      <div className={classes.targetRows}>
        {dual
          ? [
              targetRow("Low", state.targetTemperatureLow, (delta) => adjustRange("low", delta)),
              targetRow("High", state.targetTemperatureHigh, (delta) => adjustRange("high", delta)),
            ]
          : targetRow("Target", state.targetTemperature, adjustSingle)}
      </div>

      {showModeControl &&
        (tier === "compact" ? (
          <Text size="sm" tone="secondary">
            {hvacModeLabel(state.hvacMode)}
          </Text>
        ) : (
          <SegmentedControl
            size="sm"
            aria-label="Mode"
            options={state.hvacModes.map((mode) => ({ value: mode, label: hvacModeLabel(mode) }))}
            value={state.hvacMode}
            onValueChange={(next) => {
              if (typeof next === "string" && next !== state.hvacMode) void setHvacMode(next);
            }}
          />
        ))}

      {showExtras && (
        <div className={classes.modes}>
          {showFanControl && state.fanModes.length > 0 && (
            <Select
              label="Fan"
              options={state.fanModes.map((mode) => ({ value: mode, label: hvacModeLabel(mode) }))}
              value={state.fanMode ?? null}
              onValueChange={(key) => {
                if (typeof key === "string") void setFanMode(key);
              }}
            />
          )}
          {showPresetControl && state.presetModes.length > 0 && (
            <Select
              label="Preset"
              options={state.presetModes.map((mode) => ({
                value: mode,
                label: hvacModeLabel(mode),
              }))}
              value={state.presetMode ?? null}
              onValueChange={(key) => {
                if (typeof key === "string") void setPresetMode(key);
              }}
            />
          )}
          {showSwingControl && state.swingModes.length > 0 && (
            <Select
              label="Swing"
              options={state.swingModes.map((mode) => ({
                value: mode,
                label: hvacModeLabel(mode),
              }))}
              value={state.swingMode ?? null}
              onValueChange={(key) => {
                if (typeof key === "string") void setSwingMode(key);
              }}
            />
          )}
        </div>
      )}

      {tier === "full" && (
        <Text size="xs" tone="secondary" className={classes.hint}>
          Range {formatTemperature(state.minTemp, state.unit)}–
          {formatTemperature(state.maxTemp, state.unit)}
        </Text>
      )}

      {controlError && (
        <Text size="xs" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
          {controlError}
        </Text>
      )}

      {lastUpdated !== null && (
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

export function ThermostatWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<ThermostatConfig>) {
  const {
    entityId = "",
    showControls = true,
    showFanControl = true,
    showPresetControl = true,
    showSwingControl = false,
    showHumidity = true,
    transparentBackground = false,
  } = widget.config;
  const { entities, isLoading, error, status, refresh } = useClimateEntities();

  return (
    <Stack gap="md">
      <Text size="xs" tone="secondary">
        {status === 503
          ? "Connect the homeslate Home Assistant agent for this account."
          : "Connect Home Assistant by setting HOMEASSISTANT_BASE_URL and HOMEASSISTANT_TOKEN on the server."}
      </Text>

      {status === 501 ? (
        <Surface className={classes.notice} padding="sm">
          <Text size="sm">{THERMOSTAT_MISSING_CONFIG_COPY}</Text>
        </Surface>
      ) : status === 503 ? (
        <Surface className={classes.notice} padding="sm">
          <Text size="sm">{error ?? HA_AGENT_OFFLINE_COPY}</Text>
        </Surface>
      ) : (
        <HStack gap="xs">
          <div className={classes.fieldGrow}>
            <Select
              label="Thermostat"
              placeholder="Select a thermostat…"
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
            Refresh
          </Button>
        </HStack>
      )}

      {error && status !== 501 && status !== 503 && (
        <Text size="xs" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
          {error}
        </Text>
      )}

      <HStack justify="between">
        <Text size="sm">Show controls</Text>
        <Switch
          aria-label="Show controls"
          checked={showControls}
          onCheckedChange={(value) => onConfigChange({ showControls: value })}
        />
      </HStack>
      <HStack justify="between">
        <Text size="sm">Show fan control</Text>
        <Switch
          aria-label="Show fan control"
          checked={showFanControl}
          onCheckedChange={(value) => onConfigChange({ showFanControl: value })}
        />
      </HStack>
      <HStack justify="between">
        <Text size="sm">Show preset control</Text>
        <Switch
          aria-label="Show preset control"
          checked={showPresetControl}
          onCheckedChange={(value) => onConfigChange({ showPresetControl: value })}
        />
      </HStack>
      <HStack justify="between">
        <Text size="sm">Show swing control</Text>
        <Switch
          aria-label="Show swing control"
          checked={showSwingControl}
          onCheckedChange={(value) => onConfigChange({ showSwingControl: value })}
        />
      </HStack>
      <HStack justify="between">
        <Text size="sm">Show humidity</Text>
        <Switch
          aria-label="Show humidity"
          checked={showHumidity}
          onCheckedChange={(value) => onConfigChange({ showHumidity: value })}
        />
      </HStack>
      <HStack justify="between">
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

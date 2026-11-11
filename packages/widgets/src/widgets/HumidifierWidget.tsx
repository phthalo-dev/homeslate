import { Button, HStack, Select, Spinner, Stack, Switch, Text } from "@var-ui/react";
import { IconDroplet, IconMinus, IconPlus, IconPower, IconRefresh } from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntities, useEntity } from "../hooks/useHomeAssistant";
import {
  HUMIDIFIER_EMPTY_COPY,
  HUMIDIFIER_MISSING_CONFIG_COPY,
  clampHumidity,
  getHumidifierSizeTier,
  humidifierModeLabel,
  humidifierStateLabel,
  type HomeAssistantHumidifier,
} from "./homeAssistantHumidifier";
import * as classes from "./ClimateAuxWidget.styles";
import { ErrorText } from "../ErrorText";

export interface HumidifierConfig extends WidgetConfig {
  entityId: string;
  showMode: boolean;
  transparentBackground: boolean;
}

const HUMIDITY_STEP = 5;

export function HumidifierWidget({ widget, isEditing }: WidgetProps<HumidifierConfig>) {
  const { entityId = "", showMode = true, transparentBackground = false } = widget.config;
  const {
    entity: humidifier,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
    call,
  } = useEntity<HomeAssistantHumidifier>(entityId, {
    domain: "humidifier",
    fetchFailureCopy: HUMIDIFIER_MISSING_CONFIG_COPY,
    callFailureCopy: HUMIDIFIER_MISSING_CONFIG_COPY,
  });
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconDroplet size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{HUMIDIFIER_EMPTY_COPY}</Text>
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
            {error ?? HUMIDIFIER_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !humidifier) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!humidifier) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? "Failed to fetch humidifier"}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!humidifier.available) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconDroplet size={32} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            Unavailable
          </Text>
        </div>
      </div>
    );
  }

  const tier = getHumidifierSizeTier(widget.layout.w, widget.layout.h);
  const target = humidifier.targetHumidity;
  const targetLabel = target === null ? "—" : `${Math.round(target)}%`;
  const adjust = (delta: number) => {
    const base =
      target ?? humidifier.currentHumidity ?? (humidifier.minHumidity + humidifier.maxHumidity) / 2;
    const humidity = clampHumidity(base + delta, humidifier.minHumidity, humidifier.maxHumidity);
    void call("set_humidity", { humidity }, (current) => ({
      ...current,
      targetHumidity: humidity,
    }));
  };

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconDroplet size={18} />
          {tier === "compact" ? "Humidifier" : humidifier.name}
        </Text>
        <Button
          appearance="subtle"
          size="sm"
          aria-label={humidifier.isOn ? "Turn off" : "Turn on"}
          onClick={() =>
            void call(humidifier.isOn ? "turn_off" : "turn_on", {}, (current) => ({
              ...current,
              isOn: !current.isOn,
            }))
          }
          disabled={pending}
        >
          <IconPower size={16} />
          {humidifier.isOn ? "On" : "Off"}
        </Button>
      </div>

      <div className={classes.reading}>
        <Text className={classes.value}>
          {humidifier.currentHumidity === null ? "—" : `${Math.round(humidifier.currentHumidity)}%`}
        </Text>
        <Text size="xs" tone="secondary">
          Current · {humidifierStateLabel(humidifier)}
        </Text>
      </div>

      <div className={classes.targetRow}>
        <span className={classes.targetLabel}>Target humidity</span>
        <div className={classes.targetControls}>
          <Button
            appearance="subtle"
            size="sm"
            aria-label="Lower humidity"
            onClick={() => adjust(-HUMIDITY_STEP)}
            disabled={pending}
          >
            <IconMinus size={16} />
          </Button>
          <Text className={classes.targetValue}>{targetLabel}</Text>
          <Button
            appearance="subtle"
            size="sm"
            aria-label="Raise humidity"
            onClick={() => adjust(HUMIDITY_STEP)}
            disabled={pending}
          >
            <IconPlus size={16} />
          </Button>
        </div>
      </div>

      {showMode && tier !== "compact" && humidifier.availableModes.length > 0 && (
        <div className={classes.modes}>
          <Select
            label="Mode"
            options={humidifier.availableModes.map((mode) => ({
              value: mode,
              label: humidifierModeLabel(mode),
            }))}
            value={humidifier.mode}
            onValueChange={(key) => {
              if (typeof key === "string" && key !== humidifier.mode) {
                void call("set_mode", { mode: key }, (current) => ({ ...current, mode: key }));
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

export function HumidifierWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<HumidifierConfig>) {
  const { entityId = "", showMode = true, transparentBackground = false } = widget.config;
  const { entities, isLoading, error, status, refresh } = useEntities(
    "humidifier",
    HUMIDIFIER_MISSING_CONFIG_COPY,
  );

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{HUMIDIFIER_MISSING_CONFIG_COPY}</Text>
      ) : (
        <HStack gap="xs" align="end">
          <div className={classes.fieldGrow}>
            <Select
              label="Humidifier"
              placeholder="Select a humidifier…"
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
        <Text size="sm">Show mode picker</Text>
        <Switch
          aria-label="Show mode picker"
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

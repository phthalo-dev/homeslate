import {
  Button,
  HStack,
  Select,
  Slider,
  Spinner,
  Stack,
  Switch,
  Text,
  ToggleButton,
} from "@var-ui/react";
import { IconPower, IconRefresh, IconWind } from "@tabler/icons-react";
import { useState } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntities, useEntity } from "../hooks/useHomeAssistant";
import { useOverlayPortalContainer } from "../overlayPortal";
import {
  FAN_EMPTY_COPY,
  FAN_FEATURE_OSCILLATE,
  FAN_FEATURE_PRESET_MODE,
  FAN_FEATURE_SET_SPEED,
  FAN_MISSING_CONFIG_COPY,
  fanStateLabel,
  fanSupports,
  getFanSizeTier,
  type HomeAssistantFan,
} from "./homeAssistantFan";
import * as classes from "./FanWidget.styles";
import { ErrorText } from "../ErrorText";

export interface FanConfig extends WidgetConfig {
  entityId: string;
  showPreset: boolean;
  showOscillate: boolean;
  transparentBackground: boolean;
}

export function FanWidget({ widget, isEditing }: WidgetProps<FanConfig>) {
  const {
    entityId = "",
    showPreset = true,
    showOscillate = true,
    transparentBackground = false,
  } = widget.config;
  const {
    entity: fan,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
    call,
  } = useEntity<HomeAssistantFan>(entityId, {
    domain: "fan",
    fetchFailureCopy: FAN_MISSING_CONFIG_COPY,
    callFailureCopy: FAN_MISSING_CONFIG_COPY,
  });
  const portalContainer = useOverlayPortalContainer();
  const [draft, setDraft] = useState<number | null>(null);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconWind size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{FAN_EMPTY_COPY}</Text>
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
            {error ?? FAN_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !fan) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!fan) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? "Failed to fetch fan"}</ErrorText>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!fan.available) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconWind size={32} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            Unavailable
          </Text>
        </div>
      </div>
    );
  }

  const tier = getFanSizeTier(widget.layout.w, widget.layout.h);
  const showSpeed = tier !== "compact" && fanSupports(fan, FAN_FEATURE_SET_SPEED);
  const showPresetControl =
    tier === "full" &&
    showPreset &&
    fanSupports(fan, FAN_FEATURE_PRESET_MODE) &&
    fan.presetModes.length > 0;
  const showOscillateControl =
    tier === "full" &&
    showOscillate &&
    fanSupports(fan, FAN_FEATURE_OSCILLATE) &&
    fan.oscillating !== null;
  const speed = draft ?? Math.max(1, Math.round(fan.percentage ?? 100));

  const commitSpeed = async (value: number) => {
    const percentage = Math.min(100, Math.max(1, Math.round(value)));
    await call("set_percentage", { percentage }, (current) => ({
      ...current,
      isOn: true,
      percentage,
    }));
    setDraft(null);
  };

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconWind size={18} />
          {tier === "compact" ? "Fan" : fan.name}
        </Text>
        {isLoading && <Spinner size="sm" />}
      </div>

      <div className={classes.powerRow}>
        <ToggleButton
          className={`${classes.powerButton} ${fan.isOn ? classes.powerButtonOn : ""}`}
          isSelected={fan.isOn}
          isDisabled={pending}
          aria-label={fan.isOn ? "Turn off" : "Turn on"}
          onChange={() =>
            void call(fan.isOn ? "turn_off" : "turn_on", {}, (current) => ({
              ...current,
              isOn: !current.isOn,
            }))
          }
        >
          <IconPower size={22} />
        </ToggleButton>
        <span className={classes.state}>
          <Text size="sm" tone="secondary">
            {fanStateLabel(fan)}
          </Text>
          {fan.presetMode && (
            <Text size="xs" tone="secondary">
              Preset: {fan.presetMode}
            </Text>
          )}
        </span>
      </div>

      {showSpeed && (
        <HStack gap="sm" align="center" className={classes.speedRow}>
          <Slider
            className={classes.range}
            aria-label="Fan speed"
            minValue={1}
            maxValue={100}
            step={1}
            value={speed}
            showOutput={false}
            isDisabled={pending}
            onChange={(value) => setDraft(typeof value === "number" ? value : (value[0] ?? speed))}
            onChangeEnd={(value) =>
              void commitSpeed(typeof value === "number" ? value : (value[0] ?? speed))
            }
          />
          <Text size="xs" tone="secondary">
            {speed}%
          </Text>
        </HStack>
      )}

      {showPresetControl && (
        <Select
          label="Preset"
          options={fan.presetModes.map((mode) => ({ id: mode, label: mode }))}
          selectedKey={fan.presetMode}
          onSelectionChange={(key) => {
            if (typeof key === "string" && key !== fan.presetMode) {
              void call("set_preset_mode", { preset_mode: key }, (current) => ({
                ...current,
                presetMode: key,
              }));
            }
          }}
          portalContainer={portalContainer}
        />
      )}

      {showOscillateControl && (
        <div className={classes.modeRow}>
          <Text size="sm">Oscillate</Text>
          <Switch
            aria-label="Oscillate"
            isSelected={fan.oscillating === true}
            onChange={(value) =>
              void call("oscillate", { oscillating: value }, (current) => ({
                ...current,
                oscillating: value,
              }))
            }
          />
        </div>
      )}

      {(controlError || error) && (
        <div className={classes.errorBox}>
          <ErrorText size="xs">{controlError ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
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

export function FanWidgetSettings({ widget, onConfigChange }: WidgetProps<FanConfig>) {
  const {
    entityId = "",
    showPreset = true,
    showOscillate = true,
    transparentBackground = false,
  } = widget.config;
  const portalContainer = useOverlayPortalContainer();
  const { entities, isLoading, error, status, refresh } = useEntities(
    "fan",
    FAN_MISSING_CONFIG_COPY,
  );

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{FAN_MISSING_CONFIG_COPY}</Text>
      ) : (
        <HStack gap="xs" align="end">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Select
              label="Fan"
              placeholder="Select a fan…"
              options={entities.map((entity) => ({
                id: entity.entityId,
                label: `${entity.name} (${entity.entityId})`,
              }))}
              selectedKey={entityId || null}
              onSelectionChange={(key) => {
                if (typeof key === "string") onConfigChange({ entityId: key });
              }}
              portalContainer={portalContainer}
            />
          </div>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
            <IconRefresh size={14} />
          </Button>
        </HStack>
      )}

      {error && status !== 501 && <ErrorText size="xs">{error}</ErrorText>}

      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show preset picker</Text>
        <Switch
          aria-label="Show preset picker"
          isSelected={showPreset}
          onChange={(value) => onConfigChange({ showPreset: value })}
        />
      </HStack>
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show oscillate control</Text>
        <Switch
          aria-label="Show oscillate control"
          isSelected={showOscillate}
          onChange={(value) => onConfigChange({ showOscillate: value })}
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

import {
  Button,
  HStack,
  Select,
  Slider,
  Spinner,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import {
  IconBulb,
  IconCamera,
  IconCarGarage,
  IconChevronDown,
  IconChevronUp,
  IconDeviceTv,
  IconDroplet,
  IconDownload,
  IconFlame,
  IconGauge,
  IconHome,
  IconLawnMower,
  IconLock,
  IconLockOpen,
  IconPlayerPause,
  IconPlayerPlay,
  IconPower,
  IconRefresh,
  IconRobot,
  IconShieldLock,
  IconTemperature,
  IconUsers,
  IconWind,
} from "@tabler/icons-react";
import { useState, type ComponentType } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntitiesAcross, useEntity } from "../hooks/useHomeAssistant";
import { useOverlayPortalContainer } from "../overlayPortal";
import { HOME_ASSISTANT_DOMAINS } from "./homeAssistantDomains";
import {
  ENTITY_TILE_EMPTY_COPY,
  ENTITY_TILE_MISSING_CONFIG_COPY,
  describeEntityTile,
} from "./homeAssistantTile";
import * as classes from "./EntityTileWidget.styles";
import { securityHighRiskLocked } from "./securityControls";
import { ErrorText } from "../ErrorText";

export interface EntityTileConfig extends WidgetConfig {
  entityId: string;
  label: string;
  showControls: boolean;
  transparentBackground: boolean;
}

function tileIcon(domain: string): ComponentType<{ size?: number | string }> {
  switch (domain) {
    case "light":
      return IconBulb;
    case "switch":
    case "input_boolean":
      return IconPower;
    case "fan":
      return IconWind;
    case "cover":
      return IconCarGarage;
    case "media_player":
      return IconDeviceTv;
    case "lock":
      return IconLock;
    case "alarm_control_panel":
      return IconShieldLock;
    case "sensor":
    case "binary_sensor":
    case "number":
    case "input_number":
      return IconGauge;
    case "climate":
      return IconTemperature;
    case "vacuum":
      return IconRobot;
    case "humidifier":
      return IconDroplet;
    case "water_heater":
      return IconFlame;
    case "lawn_mower":
      return IconLawnMower;
    case "camera":
      return IconCamera;
    case "update":
      return IconDownload;
    case "person":
    case "device_tracker":
      return IconUsers;
    default:
      return IconHome;
  }
}

export function EntityTileWidget({ widget, isEditing }: WidgetProps<EntityTileConfig>) {
  const {
    entityId = "",
    label = "",
    showControls = true,
    transparentBackground = false,
  } = widget.config;
  const domain = entityId.includes(".") ? entityId.slice(0, entityId.indexOf(".")) : "";
  const {
    entity,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
    call,
  } = useEntity<Record<string, unknown>>(entityId, {
    domain,
    fetchFailureCopy: ENTITY_TILE_MISSING_CONFIG_COPY,
    callFailureCopy: ENTITY_TILE_MISSING_CONFIG_COPY,
  });
  const [brightnessDraft, setBrightnessDraft] = useState<number | null>(null);
  const [positionDraft, setPositionDraft] = useState<number | null>(null);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconHome size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{ENTITY_TILE_EMPTY_COPY}</Text>
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
            {error ?? ENTITY_TILE_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !entity) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? "Failed to fetch entity"}</ErrorText>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const descriptor = describeEntityTile(entityId, entity);
  const Icon = tileIcon(domain);
  const displayName = label.trim() || descriptor.name;
  const canControl = showControls && descriptor.available;
  const highRiskLocked = securityHighRiskLocked(lastUpdated);
  const unlockLocked = descriptor.isLocked === true && highRiskLocked;
  const brightness = brightnessDraft ?? Math.round(descriptor.brightnessPct ?? 100);
  const position = positionDraft ?? Math.round(descriptor.position ?? 0);

  const toggle = () => {
    if (!canControl) return;
    void call(descriptor.isOn ? "turn_off" : "turn_on", {}, (current) => ({
      ...current,
      isOn: !descriptor.isOn,
    }));
  };

  const commitBrightness = async (value: number) => {
    const pct = Math.min(100, Math.max(1, Math.round(value)));
    await call("turn_on", { brightness_pct: pct }, (current) => ({
      ...current,
      isOn: true,
      brightnessPct: pct,
    }));
    setBrightnessDraft(null);
  };

  const openCover = () => {
    if (!canControl) return;
    void call("open_cover", {}, (current) => ({ ...current, state: "open", position: 100 }));
  };

  const closeCover = () => {
    if (!canControl) return;
    void call("close_cover", {}, (current) => ({ ...current, state: "closed", position: 0 }));
  };

  const commitPosition = async (value: number) => {
    const next = Math.min(100, Math.max(0, Math.round(value)));
    await call("set_cover_position", { position: next }, (current) => ({
      ...current,
      state: next > 0 ? "open" : "closed",
      position: next,
    }));
    setPositionDraft(null);
  };

  const toggleLock = () => {
    if (!canControl || unlockLocked) return;
    if (
      descriptor.isLocked &&
      typeof window !== "undefined" &&
      !window.confirm(`Unlock ${displayName}?`)
    ) {
      return;
    }
    void call(descriptor.isLocked ? "unlock" : "lock", {}, (current) => ({
      ...current,
      state: descriptor.isLocked ? "unlocked" : "locked",
      isLocked: !descriptor.isLocked,
    }));
  };

  const playPause = () => {
    if (!canControl) return;
    void call("media_play_pause", {}, (current) => ({
      ...current,
      state: current.state === "playing" ? "paused" : "playing",
    }));
  };

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <span className={classes.headerIcon}>
          <Icon size={20} />
        </span>
        <span className={classes.title}>
          <span className={classes.name}>{displayName}</span>
          <span className={classes.state}>{descriptor.stateLabel}</span>
        </span>
        {isLoading && <Spinner size="sm" />}
      </div>

      {(controlError || error) && (
        <div className={classes.errorBox}>
          <ErrorText size="xs">{controlError ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      )}

      {showControls && descriptor.control !== "none" && (
        <div className={classes.controls}>
          {descriptor.control === "toggle" && (
            <div className={classes.actions}>
              <Button
                appearance="subtle"
                size="sm"
                onPress={toggle}
                isDisabled={!canControl || pending}
              >
                <IconPower size={16} />
                {descriptor.isOn ? "Turn off" : "Turn on"}
              </Button>
            </div>
          )}

          {descriptor.control === "brightness" && (
            <>
              <div className={classes.actions}>
                <Button
                  appearance="subtle"
                  size="sm"
                  onPress={toggle}
                  isDisabled={!canControl || pending}
                >
                  <IconBulb size={16} />
                  {descriptor.isOn ? "Turn off" : "Turn on"}
                </Button>
              </div>
              {descriptor.isOn && (
                <HStack gap="sm" align="center" className={classes.sliderRow}>
                  <Slider
                    className={classes.range}
                    aria-label={`Brightness for ${displayName}`}
                    minValue={1}
                    maxValue={100}
                    step={1}
                    value={brightness}
                    showOutput={false}
                    isDisabled={!canControl || pending}
                    onChange={(value) =>
                      setBrightnessDraft(
                        typeof value === "number" ? value : (value[0] ?? brightness),
                      )
                    }
                    onChangeEnd={(value) =>
                      void commitBrightness(
                        typeof value === "number" ? value : (value[0] ?? brightness),
                      )
                    }
                  />
                  <Text size="xs" tone="secondary">
                    {brightness}%
                  </Text>
                </HStack>
              )}
            </>
          )}

          {descriptor.control === "position" && (
            <>
              <div className={classes.actions}>
                <Button
                  appearance="subtle"
                  size="sm"
                  onPress={openCover}
                  isDisabled={!canControl || pending}
                >
                  <IconChevronUp size={16} />
                  Open
                </Button>
                <Button
                  appearance="subtle"
                  size="sm"
                  onPress={closeCover}
                  isDisabled={!canControl || pending}
                >
                  <IconChevronDown size={16} />
                  Close
                </Button>
              </div>
              {descriptor.position !== null && (
                <HStack gap="sm" align="center" className={classes.sliderRow}>
                  <Slider
                    className={classes.range}
                    aria-label={`Position for ${displayName}`}
                    minValue={0}
                    maxValue={100}
                    step={1}
                    value={position}
                    showOutput={false}
                    isDisabled={!canControl || pending}
                    onChange={(value) =>
                      setPositionDraft(typeof value === "number" ? value : (value[0] ?? position))
                    }
                    onChangeEnd={(value) =>
                      void commitPosition(
                        typeof value === "number" ? value : (value[0] ?? position),
                      )
                    }
                  />
                  <Text size="xs" tone="secondary">
                    {position}%
                  </Text>
                </HStack>
              )}
            </>
          )}

          {descriptor.control === "play-pause" && (
            <div className={classes.actions}>
              <Button
                appearance="subtle"
                size="sm"
                onPress={playPause}
                isDisabled={!canControl || pending}
              >
                {descriptor.isOn ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                {descriptor.isOn ? "Pause" : "Play"}
              </Button>
            </div>
          )}

          {descriptor.control === "lock" && (
            <div className={classes.actions}>
              {unlockLocked && (
                <Text size="xs" tone="secondary">
                  Refresh to unlock
                </Text>
              )}
              <Button
                appearance="subtle"
                size="sm"
                onPress={toggleLock}
                isDisabled={!canControl || pending || unlockLocked}
              >
                {descriptor.isLocked ? <IconLockOpen size={16} /> : <IconLock size={16} />}
                {descriptor.isLocked ? "Unlock" : "Lock"}
              </Button>
            </div>
          )}
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

export function EntityTileWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<EntityTileConfig>) {
  const {
    entityId = "",
    label = "",
    showControls = true,
    transparentBackground = false,
  } = widget.config;
  const portalContainer = useOverlayPortalContainer();
  const { entities, isLoading, error, status, refresh } = useEntitiesAcross(
    [...HOME_ASSISTANT_DOMAINS],
    ENTITY_TILE_MISSING_CONFIG_COPY,
  );

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{ENTITY_TILE_MISSING_CONFIG_COPY}</Text>
      ) : (
        <HStack gap="xs" align="end">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Select
              label="Entity"
              placeholder="Select any entity…"
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

      <TextField
        label="Label override"
        placeholder="Defaults to the entity name"
        value={label}
        onChange={(value) => onConfigChange({ label: value })}
      />

      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show controls</Text>
        <Switch
          aria-label="Show controls"
          isSelected={showControls}
          onChange={(value) => onConfigChange({ showControls: value })}
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

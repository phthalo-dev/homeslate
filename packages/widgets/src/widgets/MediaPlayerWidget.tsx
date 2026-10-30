import { Button, HStack, Select, Slider, Spinner, Stack, Switch, Text } from "@var-ui/react";
import {
  IconDeviceTv,
  IconMusic,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconPower,
  IconRefresh,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react";
import { useState } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntities, useEntity } from "../hooks/useHomeAssistant";
import { useOverlayPortalContainer } from "../overlayPortal";
import {
  MEDIA_PLAYER_EMPTY_COPY,
  MEDIA_PLAYER_FEATURE,
  MEDIA_PLAYER_MISSING_CONFIG_COPY,
  formatMediaTime,
  getMediaPlayerSizeTier,
  homeAssistantImageProxyUrl,
  mediaPlayerIsPlaying,
  mediaPlayerStateLabel,
  mediaPlayerSubtitle,
  mediaPlayerSupports,
  mediaPlayerTitle,
  mediaProgressPct,
  type HomeAssistantMediaPlayer,
} from "./homeAssistantMediaPlayer";
import * as classes from "./MediaPlayerWidget.styles";
import { ErrorText } from "../ErrorText";

export interface MediaPlayerConfig extends WidgetConfig {
  entityId: string;
  showVolume: boolean;
  showSource: boolean;
  transparentBackground: boolean;
}

export function MediaPlayerWidget({ widget, isEditing }: WidgetProps<MediaPlayerConfig>) {
  const {
    entityId = "",
    showVolume = true,
    showSource = true,
    transparentBackground = false,
  } = widget.config;
  const {
    entity: mediaPlayer,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
    call,
  } = useEntity<HomeAssistantMediaPlayer>(entityId, {
    domain: "media_player",
    fetchFailureCopy: MEDIA_PLAYER_MISSING_CONFIG_COPY,
    callFailureCopy: MEDIA_PLAYER_MISSING_CONFIG_COPY,
  });
  const portalContainer = useOverlayPortalContainer();
  const [volumeDraft, setVolumeDraft] = useState<number | null>(null);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconDeviceTv size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{MEDIA_PLAYER_EMPTY_COPY}</Text>
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
            {error ?? MEDIA_PLAYER_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !mediaPlayer) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!mediaPlayer) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? "Failed to fetch media player"}</ErrorText>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!mediaPlayer.available) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconDeviceTv size={32} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            Unavailable
          </Text>
        </div>
      </div>
    );
  }

  const tier = getMediaPlayerSizeTier(widget.layout.w, widget.layout.h);
  const showExtras = tier !== "compact";
  const artUrl = homeAssistantImageProxyUrl(mediaPlayer.entityPicture);
  const subtitle = mediaPlayerSubtitle(mediaPlayer);
  const progress = mediaProgressPct(mediaPlayer);
  const volumePct = volumeDraft ?? Math.round((mediaPlayer.volumeLevel ?? 0) * 100);
  const poweredOff = mediaPlayer.state === "off";
  const showVolumeControl =
    tier === "full" &&
    showVolume &&
    mediaPlayerSupports(mediaPlayer, MEDIA_PLAYER_FEATURE.volumeSet);
  const showMute =
    showVolumeControl && mediaPlayerSupports(mediaPlayer, MEDIA_PLAYER_FEATURE.volumeMute);
  const showSourceControl =
    tier === "full" &&
    showSource &&
    mediaPlayerSupports(mediaPlayer, MEDIA_PLAYER_FEATURE.selectSource) &&
    mediaPlayer.sourceList.length > 0;

  const playPause = () => {
    if (poweredOff && mediaPlayerSupports(mediaPlayer, MEDIA_PLAYER_FEATURE.turnOn)) {
      void call("turn_on", {}, (current) => ({ ...current, state: "on" }));
      return;
    }
    void call("media_play_pause", {}, (current) => ({
      ...current,
      state: current.state === "playing" ? "paused" : "playing",
    }));
  };

  const commitVolume = async (value: number) => {
    const level = Math.min(1, Math.max(0, value / 100));
    await call("volume_set", { volume_level: level }, (current) => ({
      ...current,
      volumeLevel: level,
      isMuted: false,
    }));
    setVolumeDraft(null);
  };

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.heading}>
          <IconDeviceTv size={18} />
          {tier === "compact" ? "Media" : mediaPlayer.name}
        </Text>
        {isLoading && <Spinner size="sm" />}
      </div>

      <div className={classes.body}>
        {showExtras && (
          <div className={classes.artWrap}>
            <IconMusic size={32} className={classes.artFallback} />
            {artUrl && (
              <img
                key={artUrl}
                className={classes.art}
                src={artUrl}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>
        )}
        <div className={classes.info}>
          <span className={classes.title}>{mediaPlayerTitle(mediaPlayer)}</span>
          {subtitle && <span className={classes.subtitle}>{subtitle}</span>}
          <Text size="xs" tone="secondary">
            {mediaPlayerStateLabel(mediaPlayer)}
          </Text>
          {showExtras && progress !== null && (
            <>
              <div className={classes.progressTrack}>
                <div className={classes.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <div className={classes.timeRow}>
                <span>{formatMediaTime(mediaPlayer.mediaPosition)}</span>
                <span>{formatMediaTime(mediaPlayer.mediaDuration)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={classes.controls}>
        {showExtras && mediaPlayerSupports(mediaPlayer, MEDIA_PLAYER_FEATURE.previousTrack) && (
          <Button
            appearance="subtle"
            size="sm"
            aria-label="Previous track"
            onPress={() => void call("media_previous_track", {}, undefined)}
            isDisabled={pending}
          >
            <IconPlayerSkipBack size={18} />
          </Button>
        )}
        <Button
          appearance="subtle"
          size="sm"
          aria-label={poweredOff ? "Turn on" : mediaPlayerIsPlaying(mediaPlayer) ? "Pause" : "Play"}
          onPress={playPause}
          isDisabled={pending}
        >
          {poweredOff ? (
            <IconPower size={18} />
          ) : mediaPlayerIsPlaying(mediaPlayer) ? (
            <IconPlayerPause size={18} />
          ) : (
            <IconPlayerPlay size={18} />
          )}
        </Button>
        {showExtras && mediaPlayerSupports(mediaPlayer, MEDIA_PLAYER_FEATURE.nextTrack) && (
          <Button
            appearance="subtle"
            size="sm"
            aria-label="Next track"
            onPress={() => void call("media_next_track", {}, undefined)}
            isDisabled={pending}
          >
            <IconPlayerSkipForward size={18} />
          </Button>
        )}
        {tier === "full" &&
          !poweredOff &&
          mediaPlayerSupports(mediaPlayer, MEDIA_PLAYER_FEATURE.turnOff) && (
            <Button
              appearance="subtle"
              size="sm"
              aria-label="Turn off"
              onPress={() => void call("turn_off", {}, (current) => ({ ...current, state: "off" }))}
              isDisabled={pending}
            >
              <IconPower size={16} />
            </Button>
          )}
      </div>

      {showVolumeControl && (
        <div className={classes.volumeRow}>
          {showMute && (
            <Button
              appearance="subtle"
              size="sm"
              aria-label={mediaPlayer.isMuted ? "Unmute" : "Mute"}
              onPress={() =>
                void call("volume_mute", { is_volume_muted: !mediaPlayer.isMuted }, (current) => ({
                  ...current,
                  isMuted: !current.isMuted,
                }))
              }
              isDisabled={pending}
            >
              {mediaPlayer.isMuted ? <IconVolumeOff size={16} /> : <IconVolume size={16} />}
            </Button>
          )}
          <Slider
            className={classes.range}
            aria-label="Volume"
            minValue={0}
            maxValue={100}
            step={1}
            value={volumePct}
            showOutput={false}
            isDisabled={pending}
            onChange={(value) =>
              setVolumeDraft(typeof value === "number" ? value : (value[0] ?? volumePct))
            }
            onChangeEnd={(value) =>
              void commitVolume(typeof value === "number" ? value : (value[0] ?? volumePct))
            }
          />
          <Text size="xs" tone="secondary">
            {volumePct}%
          </Text>
        </div>
      )}

      {showSourceControl && (
        <Select
          label="Source"
          options={mediaPlayer.sourceList.map((source) => ({ id: source, label: source }))}
          selectedKey={mediaPlayer.source}
          onSelectionChange={(key) => {
            if (typeof key === "string" && key !== mediaPlayer.source) {
              void call("select_source", { source: key }, (current) => ({
                ...current,
                source: key,
              }));
            }
          }}
          portalContainer={portalContainer}
        />
      )}

      {controlError && <ErrorText size="xs">{controlError}</ErrorText>}

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

export function MediaPlayerWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<MediaPlayerConfig>) {
  const {
    entityId = "",
    showVolume = true,
    showSource = true,
    transparentBackground = false,
  } = widget.config;
  const portalContainer = useOverlayPortalContainer();
  const { entities, isLoading, error, status, refresh } = useEntities(
    "media_player",
    MEDIA_PLAYER_MISSING_CONFIG_COPY,
  );

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{MEDIA_PLAYER_MISSING_CONFIG_COPY}</Text>
      ) : (
        <HStack gap="xs" align="end">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Select
              label="Media player"
              placeholder="Select a player…"
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
        <Text size="sm">Show volume</Text>
        <Switch
          aria-label="Show volume"
          isSelected={showVolume}
          onChange={(value) => onConfigChange({ showVolume: value })}
        />
      </HStack>
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show source picker</Text>
        <Switch
          aria-label="Show source picker"
          isSelected={showSource}
          onChange={(value) => onConfigChange({ showSource: value })}
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

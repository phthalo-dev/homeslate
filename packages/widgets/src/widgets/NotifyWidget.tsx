import {
  Button,
  HStack,
  SegmentedControl,
  Select,
  Spinner,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import { IconBell, IconCheck, IconRefresh, IconSend, IconSpeakerphone } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntities, useEntity, useHomeAssistantService } from "../hooks/useHomeAssistant";
import { useOverlayPortalContainer } from "../overlayPortal";
import type { HomeAssistantEntitySummary } from "./homeAssistant";
import {
  NOTIFY_EMPTY_COPY,
  NOTIFY_MISSING_CONFIG_COPY,
  NOTIFY_NO_MESSAGE_COPY,
  NOTIFY_TARGET_MISSING_COPY,
  NOTIFY_TTS_NO_MEDIA_PLAYER_COPY,
  buildNotifyPayload,
  buildTtsPayload,
  notifyService,
  notifyTargetId,
  type NotifyMode,
} from "./homeAssistantNotify";
import * as classes from "./NotifyWidget.styles";
import { ErrorText } from "../ErrorText";

export interface NotifyConfig extends WidgetConfig {
  mode: NotifyMode;
  notifyEntityId: string;
  ttsEntityId: string;
  mediaPlayerEntityId: string;
  title: string;
  defaultMessage: string;
  transparentBackground: boolean;
}

export function NotifyWidget({ widget, isEditing }: WidgetProps<NotifyConfig>) {
  const {
    mode = "notify",
    notifyEntityId = "",
    ttsEntityId = "",
    mediaPlayerEntityId = "",
    title = "",
    defaultMessage = "",
    transparentBackground = false,
  } = widget.config;
  const targetId = notifyTargetId(mode, notifyEntityId, ttsEntityId);
  const {
    entity: target,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
  } = useEntity<HomeAssistantEntitySummary>(targetId, {
    domain: mode,
    fetchFailureCopy: NOTIFY_MISSING_CONFIG_COPY,
    callFailureCopy: NOTIFY_MISSING_CONFIG_COPY,
  });
  const callService = useHomeAssistantService(NOTIFY_MISSING_CONFIG_COPY);
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage]);

  const send = async () => {
    const payload =
      mode === "notify"
        ? buildNotifyPayload(message, title)
        : buildTtsPayload(message, mediaPlayerEntityId);
    if (!payload) {
      setSendError(
        mode === "tts" && !mediaPlayerEntityId
          ? NOTIFY_TTS_NO_MEDIA_PLAYER_COPY
          : NOTIFY_NO_MESSAGE_COPY,
      );
      return;
    }
    if (!targetId) return;

    setSending(true);
    setSent(false);
    setSendError(null);
    try {
      await callService(mode, notifyService(mode), targetId, payload);
      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : NOTIFY_MISSING_CONFIG_COPY);
    } finally {
      setSending(false);
    }
  };

  if (!targetId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          {mode === "notify" ? (
            <IconBell size={32} className={classes.emptyIcon} />
          ) : (
            <IconSpeakerphone size={32} className={classes.emptyIcon} />
          )}
          <Text className={classes.emptyTitle}>{NOTIFY_EMPTY_COPY}</Text>
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
            {error ?? NOTIFY_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !target) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? NOTIFY_TARGET_MISSING_COPY}</ErrorText>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const targetUnavailable = target.state === "unavailable" || target.state === "unknown";
  const canSend =
    !sending && message.trim().length > 0 && (mode === "notify" || mediaPlayerEntityId !== "");

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <span className={classes.headerIcon}>
          {mode === "notify" ? <IconBell size={20} /> : <IconSpeakerphone size={20} />}
        </span>
        <span className={classes.title}>
          <span className={classes.name}>{mode === "notify" ? "Notify" : "Speak"}</span>
          <span className={classes.target}>{target.name}</span>
        </span>
      </div>

      {targetUnavailable ? (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            {NOTIFY_TARGET_MISSING_COPY}
          </Text>
        </div>
      ) : (
        <div className={classes.form}>
          <TextField
            aria-label="Message"
            placeholder={mode === "notify" ? "Message…" : "What should it say?"}
            value={message}
            onChange={(value) => {
              setMessage(value);
              setSent(false);
            }}
          />
          <div className={classes.row}>
            <Button
              tone="accent"
              appearance="filled"
              size="sm"
              onPress={send}
              isDisabled={!canSend || pending}
            >
              <IconSend size={14} />
              {sending ? "Sending…" : "Send"}
            </Button>
            {sent && (
              <span className={classes.status}>
                <IconCheck size={14} />
                Sent
              </span>
            )}
          </div>
          {mode === "tts" && !mediaPlayerEntityId && (
            <Text size="xs" tone="secondary">
              {NOTIFY_TTS_NO_MEDIA_PLAYER_COPY}
            </Text>
          )}
        </div>
      )}

      {(sendError || controlError || error) && (
        <div className={classes.errorBox}>
          <ErrorText size="xs">{sendError ?? controlError ?? error}</ErrorText>
          {error && (
            <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
              <IconRefresh size={14} />
              Retry
            </Button>
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

export function NotifyWidgetSettings({ widget, onConfigChange }: WidgetProps<NotifyConfig>) {
  const {
    mode = "notify",
    notifyEntityId = "",
    ttsEntityId = "",
    mediaPlayerEntityId = "",
    title = "",
    defaultMessage = "",
    transparentBackground = false,
  } = widget.config;
  const portalContainer = useOverlayPortalContainer();
  const notify = useEntities("notify", NOTIFY_MISSING_CONFIG_COPY);
  const tts = useEntities("tts", NOTIFY_MISSING_CONFIG_COPY);
  const mediaPlayers = useEntities("media_player", NOTIFY_MISSING_CONFIG_COPY);

  const notConfigured = notify.status === 501 || tts.status === 501 || mediaPlayers.status === 501;

  const options = (entities: HomeAssistantEntitySummary[]) =>
    entities.map((entity) => ({
      id: entity.entityId,
      label: `${entity.name} (${entity.entityId})`,
    }));

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text size="sm">Mode</Text>
        <SegmentedControl
          size="sm"
          aria-label="Notification mode"
          options={[
            { id: "notify", label: "Notify" },
            { id: "tts", label: "Speak" },
          ]}
          selectedKeys={[mode]}
          onSelectionChange={(keys) => {
            const next = [...keys][0];
            if (next === "notify" || next === "tts") onConfigChange({ mode: next });
          }}
        />
      </Stack>

      {notConfigured ? (
        <Text size="sm">{NOTIFY_MISSING_CONFIG_COPY}</Text>
      ) : mode === "notify" ? (
        <Select
          label="Notification target"
          placeholder="Select a notify entity…"
          options={options(notify.entities)}
          selectedKey={notifyEntityId || null}
          onSelectionChange={(key) => {
            if (typeof key === "string") onConfigChange({ notifyEntityId: key });
          }}
          portalContainer={portalContainer}
        />
      ) : (
        <>
          <Select
            label="TTS target"
            placeholder="Select a TTS entity…"
            options={options(tts.entities)}
            selectedKey={ttsEntityId || null}
            onSelectionChange={(key) => {
              if (typeof key === "string") onConfigChange({ ttsEntityId: key });
            }}
            portalContainer={portalContainer}
          />
          <Select
            label="Media player"
            placeholder="Select a media player…"
            options={options(mediaPlayers.entities)}
            selectedKey={mediaPlayerEntityId || null}
            onSelectionChange={(key) => {
              if (typeof key === "string") onConfigChange({ mediaPlayerEntityId: key });
            }}
            portalContainer={portalContainer}
          />
        </>
      )}

      {notify.error && notify.status !== 501 && <ErrorText size="xs">{notify.error}</ErrorText>}

      {mode === "notify" && (
        <TextField
          label="Title (optional)"
          value={title}
          onChange={(value) => onConfigChange({ title: value })}
        />
      )}
      <TextField
        label="Default message"
        value={defaultMessage}
        onChange={(value) => onConfigChange({ defaultMessage: value })}
      />
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

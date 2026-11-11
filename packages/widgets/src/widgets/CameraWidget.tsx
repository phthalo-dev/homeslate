import { Button, HStack, NumberInput, Select, Spinner, Stack, Switch, Text } from "@var-ui/react";
import { IconCamera, IconCameraOff, IconEye, IconEyeOff, IconRefresh } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntities, useEntity } from "../hooks/useHomeAssistant";
import {
  CAMERA_EMPTY_COPY,
  CAMERA_MISSING_CONFIG_COPY,
  CAMERA_PRIVATE_COPY,
  cameraSnapshotUrl,
  cameraStateLabel,
  nextCameraRefreshMs,
  type HomeAssistantCamera,
} from "./homeAssistantCamera";
import * as classes from "./CameraWidget.styles";
import { ErrorText } from "../ErrorText";

export interface CameraConfig extends WidgetConfig {
  entityId: string;
  refreshSeconds: number;
  showPrivacyToggle: boolean;
  transparentBackground: boolean;
}

export function CameraWidget({ widget, isEditing }: WidgetProps<CameraConfig>) {
  const {
    entityId = "",
    refreshSeconds = 60,
    showPrivacyToggle = true,
    transparentBackground = false,
  } = widget.config;
  const {
    entity: camera,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    refresh,
  } = useEntity<HomeAssistantCamera>(entityId, {
    domain: "camera",
    fetchFailureCopy: CAMERA_MISSING_CONFIG_COPY,
    callFailureCopy: CAMERA_MISSING_CONFIG_COPY,
  });
  const [privacy, setPrivacy] = useState(false);
  const [nonce, setNonce] = useState(() => Date.now());
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;
  const isPrivate = showPrivacyToggle && privacy;
  const src = cameraSnapshotUrl(entityId, nonce);
  const failed = failedSrc === src;

  useEffect(() => {
    if (!entityId || isPrivate) return;
    const interval = nextCameraRefreshMs(refreshSeconds);
    if (interval === null) return;
    const timer = setInterval(() => setNonce(Date.now()), interval);
    return () => clearInterval(timer);
  }, [entityId, isPrivate, refreshSeconds]);

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconCamera size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{CAMERA_EMPTY_COPY}</Text>
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
            {error ?? CAMERA_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !camera) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!camera) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? "Failed to fetch camera"}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconCamera size={18} />
          {camera.name}
        </Text>
        <div className={classes.headerActions}>
          <Text size="xs" tone="secondary">
            {cameraStateLabel(camera)}
          </Text>
          <Button
            appearance="subtle"
            size="sm"
            aria-label="Refresh snapshot"
            onClick={() => setNonce(Date.now())}
            disabled={isPrivate}
          >
            <IconRefresh size={14} />
          </Button>
          {showPrivacyToggle && (
            <Button
              appearance="subtle"
              size="sm"
              aria-label={privacy ? "Show camera" : "Hide camera"}
              onClick={() => setPrivacy((value) => !value)}
            >
              {privacy ? <IconEye size={14} /> : <IconEyeOff size={14} />}
            </Button>
          )}
        </div>
      </div>

      <div className={classes.frame}>
        {isPrivate ? (
          <div className={classes.privacyOverlay}>
            <IconCameraOff size={32} />
            <Text size="sm">{CAMERA_PRIVATE_COPY}</Text>
            <span className={classes.privacyBadge}>
              <IconEyeOff size={12} />
              Snapshots paused
            </span>
          </div>
        ) : failed ? (
          <div className={classes.privacyOverlay}>
            <IconCameraOff size={32} />
            <Text size="sm">Snapshot unavailable.</Text>
            <Button appearance="subtle" size="sm" onClick={() => setNonce(Date.now())}>
              <IconRefresh size={14} />
              Try again
            </Button>
          </div>
        ) : (
          <>
            <IconCamera size={32} className={classes.frameFallback} />
            <img
              key={src}
              className={classes.image}
              src={src}
              alt=""
              onError={() => setFailedSrc(src)}
            />
          </>
        )}
      </div>

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

export function CameraWidgetSettings({ widget, onConfigChange }: WidgetProps<CameraConfig>) {
  const {
    entityId = "",
    refreshSeconds = 60,
    showPrivacyToggle = true,
    transparentBackground = false,
  } = widget.config;
  const { entities, isLoading, error, status, refresh } = useEntities(
    "camera",
    CAMERA_MISSING_CONFIG_COPY,
  );

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{CAMERA_MISSING_CONFIG_COPY}</Text>
      ) : (
        <HStack gap="xs" align="end">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Select
              label="Camera"
              placeholder="Select a camera…"
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

      <NumberInput
        label="Refresh seconds (0 = manual)"
        min={0}
        max={3600}
        value={refreshSeconds}
        onValueChange={(value) => {
          const next = Number(value);
          onConfigChange({
            refreshSeconds: Number.isFinite(next) ? Math.min(3600, Math.max(0, next)) : 60,
          });
        }}
      />
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show privacy toggle</Text>
        <Switch
          aria-label="Show privacy toggle"
          checked={showPrivacyToggle}
          onCheckedChange={(value) => onConfigChange({ showPrivacyToggle: value })}
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

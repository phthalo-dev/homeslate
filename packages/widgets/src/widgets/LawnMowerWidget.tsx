import { Button, HStack, Select, Spinner, Stack, Switch, Text } from "@var-ui/react";
import {
  IconHome,
  IconLawnMower,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
} from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntities, useEntity } from "../hooks/useHomeAssistant";
import {
  LAWN_MOWER_EMPTY_COPY,
  LAWN_MOWER_MISSING_CONFIG_COPY,
  lawnMowerStateLabel,
  type HomeAssistantLawnMower,
} from "./homeAssistantLawnMower";
import * as classes from "./LawnMowerWidget.styles";
import { ErrorText } from "../ErrorText";

export interface LawnMowerConfig extends WidgetConfig {
  entityId: string;
  transparentBackground: boolean;
}

function stateColor(mower: HomeAssistantLawnMower): string {
  if (!mower.available) return "var(--var-ui-color-text-secondary)";
  if (mower.state === "mowing") return "var(--var-ui-color-tone-success-foreground)";
  if (mower.state === "returning") return "var(--var-ui-color-tone-warning-foreground)";
  if (mower.state === "error") return "var(--var-ui-color-tone-danger-foreground)";
  return "var(--var-ui-color-text-secondary)";
}

export function LawnMowerWidget({ widget, isEditing }: WidgetProps<LawnMowerConfig>) {
  const { entityId = "", transparentBackground = false } = widget.config;
  const {
    entity: mower,
    isLoading,
    error,
    controlError,
    status,
    lastUpdated,
    isStale,
    pending,
    refresh,
    call,
  } = useEntity<HomeAssistantLawnMower>(entityId, {
    domain: "lawn_mower",
    fetchFailureCopy: LAWN_MOWER_MISSING_CONFIG_COPY,
    callFailureCopy: LAWN_MOWER_MISSING_CONFIG_COPY,
  });
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconLawnMower size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{LAWN_MOWER_EMPTY_COPY}</Text>
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
            {error ?? LAWN_MOWER_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !mower) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!mower) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? "Failed to fetch lawn mower"}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const mowing = mower.state === "mowing";

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconLawnMower size={18} />
          {mower.name}
        </Text>
        {!mower.available && (
          <Text size="xs" tone="secondary">
            Unavailable
          </Text>
        )}
      </div>

      <div className={classes.stateRow}>
        <Text className={classes.stateLabel} style={{ color: stateColor(mower) }}>
          {lawnMowerStateLabel(mower)}
        </Text>
      </div>

      <div className={classes.actions}>
        <Button
          appearance="subtle"
          size="sm"
          onClick={() =>
            void call("start_pause", {}, (current) => ({
              ...current,
              state: current.state === "mowing" ? "paused" : "mowing",
            }))
          }
          disabled={!mower.available || pending}
        >
          {mowing ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
          {mowing ? "Pause" : "Start"}
        </Button>
        <Button
          appearance="subtle"
          size="sm"
          onClick={() => void call("dock", {}, (current) => ({ ...current, state: "returning" }))}
          disabled={!mower.available || pending}
        >
          <IconHome size={16} />
          Dock
        </Button>
        <Button
          appearance="subtle"
          size="sm"
          onClick={() => void call("stop", {}, (current) => ({ ...current, state: "paused" }))}
          disabled={!mower.available || pending}
        >
          <IconPlayerStop size={16} />
          Stop
        </Button>
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

export function LawnMowerWidgetSettings({ widget, onConfigChange }: WidgetProps<LawnMowerConfig>) {
  const { entityId = "", transparentBackground = false } = widget.config;
  const { entities, isLoading, error, status, refresh } = useEntities(
    "lawn_mower",
    LAWN_MOWER_MISSING_CONFIG_COPY,
  );

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{LAWN_MOWER_MISSING_CONFIG_COPY}</Text>
      ) : (
        <HStack gap="xs" align="end">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Select
              label="Lawn mower"
              placeholder="Select a lawn mower…"
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

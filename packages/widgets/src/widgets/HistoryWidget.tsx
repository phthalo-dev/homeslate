import { Button, HStack, NumberInput, Select, Spinner, Stack, Switch, Text } from "@var-ui/react";
import { IconGauge, IconRefresh, IconTrendingUp } from "@tabler/icons-react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntitiesAcross, useEntity } from "../hooks/useHomeAssistant";
import { useHomeAssistantHistory } from "../hooks/useHomeAssistantHistory";
import type { HomeAssistantSensor } from "./homeAssistantSensor";
import {
  HISTORY_EMPTY_COPY,
  HISTORY_HOURS_DEFAULT,
  HISTORY_HOURS_MAX,
  HISTORY_MISSING_CONFIG_COPY,
  buildSparklinePath,
  formatHistoryValue,
  historyLatest,
  historyRange,
} from "./homeAssistantHistory";
import * as classes from "./HistoryWidget.styles";
import { ErrorText } from "../ErrorText";

export interface HistoryConfig extends WidgetConfig {
  entityId: string;
  hours: number;
  transparentBackground: boolean;
}

export function HistoryWidget({ widget, isEditing }: WidgetProps<HistoryConfig>) {
  const {
    entityId = "",
    hours = HISTORY_HOURS_DEFAULT,
    transparentBackground = false,
  } = widget.config;
  const domain = entityId.includes(".") ? entityId.slice(0, entityId.indexOf(".")) : "";
  const {
    entity: sensor,
    isLoading,
    error,
    status,
    lastUpdated,
    isStale,
    refresh,
  } = useEntity<HomeAssistantSensor>(entityId, {
    domain,
    fetchFailureCopy: HISTORY_MISSING_CONFIG_COPY,
    callFailureCopy: HISTORY_MISSING_CONFIG_COPY,
  });
  const history = useHomeAssistantHistory(entityId, hours, HISTORY_MISSING_CONFIG_COPY);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!entityId) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconTrendingUp size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{HISTORY_EMPTY_COPY}</Text>
        </div>
      </div>
    );
  }

  if (status === 501 || history.status === 501) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Text className={classes.emptyTitle}>History unavailable</Text>
          <Text size="sm" tone="secondary">
            {history.error ?? error ?? HISTORY_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if (isLoading && !sensor) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!sensor) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <ErrorText size="sm">{error ?? "Failed to fetch sensor"}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const unit = sensor.unit;
  const latest = historyLatest(history.points) ?? sensor.numericValue;
  const range = historyRange(history.points);
  const path = buildSparklinePath(history.points, 240, 80);
  const retry = () => {
    void refresh();
    void history.refresh();
  };

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconGauge size={18} />
          {sensor.name}
        </Text>
        <span className={classes.current}>{formatHistoryValue(latest, unit)}</span>
      </div>

      {path ? (
        <svg
          className={classes.chart}
          viewBox="0 0 240 80"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${sensor.name} history for the last ${hours} hours`}
        >
          <path className={classes.chartPath} d={path} />
        </svg>
      ) : (
        <div className={classes.empty}>
          <Text size="sm" tone="secondary">
            {history.isLoading ? "Loading history…" : "No numeric history yet."}
          </Text>
        </div>
      )}

      <div className={classes.rangeRow}>
        <span>{range ? formatHistoryValue(range.min, unit) : "—"}</span>
        <span>Last {hours}h</span>
        <span>{range ? formatHistoryValue(range.max, unit) : "—"}</span>
      </div>

      {(history.error || error) && (
        <div className={classes.errorBox}>
          <ErrorText size="xs">{history.error ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onClick={retry} disabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      )}

      {!isEditing && (
        <WidgetDataStatus
          widgetId={widget.id}
          lastUpdated={history.lastUpdated ?? lastUpdated}
          isStale={history.isStale || isStale}
          error={history.error ?? error}
          isLoading={isLoading || history.isLoading}
        />
      )}
    </div>
  );
}

export function HistoryWidgetSettings({ widget, onConfigChange }: WidgetProps<HistoryConfig>) {
  const {
    entityId = "",
    hours = HISTORY_HOURS_DEFAULT,
    transparentBackground = false,
  } = widget.config;
  const { entities, isLoading, error, status, refresh } = useEntitiesAcross(
    ["sensor", "number", "input_number"],
    HISTORY_MISSING_CONFIG_COPY,
  );

  return (
    <Stack gap="md">
      {status === 501 ? (
        <Text size="sm">{HISTORY_MISSING_CONFIG_COPY}</Text>
      ) : (
        <HStack gap="xs" align="end">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Select
              label="Numeric sensor"
              placeholder="Select a sensor…"
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
        label={`Window in hours (max ${HISTORY_HOURS_MAX})`}
        min={1}
        max={HISTORY_HOURS_MAX}
        value={hours}
        onValueChange={(value) => {
          const next = Number(value);
          onConfigChange({
            hours: Number.isFinite(next)
              ? Math.min(HISTORY_HOURS_MAX, Math.max(1, Math.round(next)))
              : HISTORY_HOURS_DEFAULT,
          });
        }}
      />
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

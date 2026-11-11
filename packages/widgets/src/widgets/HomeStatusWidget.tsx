import { Button, HStack, Stack, Switch, Text } from "@var-ui/react";
import {
  IconBulb,
  IconCarGarage,
  IconDoor,
  IconHome,
  IconRefresh,
  IconShieldLock,
  IconTemperature,
  IconUsers,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntityList } from "../hooks/useHomeAssistant";
import { AddEntitySelect, SelectedEntityRow } from "./AddEntitySelect";
import {
  HOME_STATUS_EMPTY_COPY,
  HOME_STATUS_MISSING_CONFIG_COPY,
  summarizeHomeStatus,
  type HomeStatusEntity,
  type HomeStatusRow,
  type HomeStatusTone,
} from "./homeStatus";
import * as classes from "./HomeStatusWidget.styles";
import { ErrorText } from "../ErrorText";

export interface HomeStatusConfig extends WidgetConfig {
  entityIds: string[];
  transparentBackground: boolean;
}

const HOME_STATUS_DOMAINS = [
  "light",
  "cover",
  "binary_sensor",
  "alarm_control_panel",
  "person",
  "device_tracker",
  "sensor",
];

function toneColor(tone: HomeStatusTone): string {
  switch (tone) {
    case "success":
      return "var(--var-ui-color-tone-success-foreground)";
    case "danger":
      return "var(--var-ui-color-tone-danger-foreground)";
    case "warning":
      return "var(--var-ui-color-tone-warning-foreground)";
    default:
      return "var(--var-ui-color-text-secondary)";
  }
}

function RowIcon({ row }: { row: HomeStatusRow }) {
  const Icon: ComponentType<{ size?: number | string }> = row.id.startsWith("temperature-")
    ? IconTemperature
    : row.id.startsWith("alarm-")
      ? IconShieldLock
      : row.id === "lights"
        ? IconBulb
        : row.id === "covers"
          ? IconCarGarage
          : row.id === "openings"
            ? IconDoor
            : row.id === "presence"
              ? IconUsers
              : IconHome;
  return <Icon size={18} />;
}

export function HomeStatusWidget({ widget, isEditing }: WidgetProps<HomeStatusConfig>) {
  const { entityIds = [], transparentBackground = false } = widget.config;
  const ids = entityIds.filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } =
    useEntityList<HomeStatusEntity>(ids, {
      fetchFailureCopy: HOME_STATUS_MISSING_CONFIG_COPY,
    });
  const rows = summarizeHomeStatus(entities);
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (ids.length === 0) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconHome size={32} className={classes.emptyIcon} />
          <Text className={classes.emptyTitle}>{HOME_STATUS_EMPTY_COPY}</Text>
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
            {error ?? HOME_STATUS_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {(error || rows.length === 0) && (
        <div className={classes.errorBox}>
          <ErrorText size="sm">{error ?? "No status to show yet."}</ErrorText>
          {error && (
            <Button appearance="subtle" size="sm" onClick={refresh} disabled={isLoading}>
              <IconRefresh size={14} />
              Retry
            </Button>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className={classes.list}>
          {rows.map((row) => (
            <div key={row.id} className={classes.row}>
              <span className={classes.rowIcon}>
                <RowIcon row={row} />
              </span>
              <Text size="sm" tone="secondary" className={classes.rowLabel}>
                {row.label}
              </Text>
              <span className={classes.rowValue} style={{ color: toneColor(row.tone) }}>
                {row.value}
              </span>
            </div>
          ))}
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

export function HomeStatusWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<HomeStatusConfig>) {
  const { entityIds = [], transparentBackground = false } = widget.config;

  return (
    <Stack gap="md">
      <AddEntitySelect
        domains={HOME_STATUS_DOMAINS}
        value={entityIds}
        onAdd={(entityId) => onConfigChange({ entityIds: [...entityIds, entityId] })}
        failureCopy={HOME_STATUS_MISSING_CONFIG_COPY}
        label="Add status entity"
      />
      {entityIds.map((entityId) => (
        <SelectedEntityRow
          key={entityId}
          entityId={entityId}
          onRemove={() =>
            onConfigChange({ entityIds: entityIds.filter((value) => value !== entityId) })
          }
        />
      ))}
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

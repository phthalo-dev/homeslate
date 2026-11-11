import {
  Button,
  HStack,
  Spinner,
  Surface,
  Select,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import { IconCar, IconPlus, IconRefresh, IconTrash } from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useCommute } from "../hooks/useCommute";
import type { WidgetConfig, WidgetProps } from "../types";
import {
  COMMUTE_EMPTY_COPY,
  COMMUTE_MISSING_KEY_COPY,
  formatCommuteDistance,
  formatCommuteDuration,
  type CommuteUnits,
} from "./commute";

import * as classes from "./CommuteWidget.styles";

const EMPTY_ROUTES: CommuteRoute[] = [];

const UNIT_OPTIONS = [
  { value: "imperial", label: "Imperial (miles)" },
  { value: "metric", label: "Metric (kilometers)" },
];

export interface CommuteRoute {
  id: string;
  label: string;
  origin: string;
  destination: string;
}

export interface CommuteConfig extends WidgetConfig {
  routes: CommuteRoute[];
  units: CommuteUnits;
  transparentBackground: boolean;
}

export function CommuteWidget({ widget }: WidgetProps<CommuteConfig>) {
  const routes = widget.config.routes ?? EMPTY_ROUTES;
  const units = widget.config.units ?? "imperial";
  const transparentBackground = widget.config.transparentBackground;
  const { results, isLoading, isStale, lastUpdated, refresh } = useCommute(routes, units);
  const resultList = [...results.values()];
  const hasMissingKey = resultList.some(({ status }) => status === 501);
  const hasEstimate = resultList.some(({ estimate }) => estimate);
  const fetchError = resultList.find(({ error, status }) => error && status !== 501)?.error ?? null;
  const failedWithoutEstimate = routes.filter((route) => {
    const result = results.get(route.id);
    return Boolean(result?.error && !result.estimate && result.status !== 501);
  });
  const wholeWidgetError =
    !hasMissingKey &&
    !hasEstimate &&
    !isLoading &&
    routes.length > 0 &&
    failedWithoutEstimate.length === routes.length
      ? (results.get(failedWithoutEstimate[0].id)?.error ?? "Failed to fetch commute")
      : null;
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (routes.length === 0) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconCar size={40} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            {COMMUTE_EMPTY_COPY}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={classes.header}>
        <Text className={classes.title}>
          <IconCar size={18} />
          Commute
        </Text>
        {isLoading && <Spinner size="sm" />}
      </div>

      {hasMissingKey && (
        <Surface className={classes.settingsNotice} padding="sm">
          <Text size="sm">{COMMUTE_MISSING_KEY_COPY}</Text>
        </Surface>
      )}

      {wholeWidgetError ? (
        <div className={classes.error}>
          <Text size="sm" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
            {wholeWidgetError}
          </Text>
          <Button appearance="subtle" size="sm" onClick={refresh}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </div>
      ) : (
        <div className={classes.list}>
          {routes.map((route) => {
            const result = results.get(route.id);
            return (
              <Surface key={route.id} className={classes.route} padding="sm">
                <Text size="sm" weight="semibold" className={classes.label}>
                  {route.label}
                </Text>
                {result?.estimate && (
                  <div className={classes.measurements}>
                    <Text className={classes.duration}>
                      {formatCommuteDuration(result.estimate.durationSeconds)}
                    </Text>
                    <Text size="sm" tone="secondary">
                      {formatCommuteDistance(result.estimate.distanceMeters, units)}
                    </Text>
                  </div>
                )}
                {result?.error && !result.estimate && result.status !== 501 && (
                  <Text size="xs" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
                    {result.error}
                  </Text>
                )}
                {!result && <Spinner size="sm" />}
              </Surface>
            );
          })}
        </div>
      )}

      {lastUpdated !== null && (
        <WidgetDataStatus
          widgetId={widget.id}
          lastUpdated={lastUpdated}
          isStale={isStale}
          error={hasMissingKey ? null : fetchError}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export function CommuteWidgetSettings({ widget, onConfigChange }: WidgetProps<CommuteConfig>) {
  const routes = widget.config.routes ?? EMPTY_ROUTES;
  const units = widget.config.units ?? "imperial";
  const transparentBackground = widget.config.transparentBackground;

  const updateRoute = (id: string, patch: Partial<CommuteRoute>) => {
    onConfigChange({
      routes: routes.map((route) => (route.id === id ? { ...route, ...patch } : route)),
    });
  };

  const removeRoute = (id: string) => {
    onConfigChange({ routes: routes.filter((route) => route.id !== id) });
  };

  const addRoute = () => {
    if (routes.length >= 4) return;
    onConfigChange({
      routes: [...routes, { id: uuidv4(), label: "", origin: "", destination: "" }],
    });
  };

  return (
    <Stack gap="md">
      <Text size="xs" tone="secondary">
        Origin and destination can be a street address or lat,lon.
      </Text>

      {routes.map((route, index) => (
        <Surface key={route.id} padding="sm">
          <Stack gap="xs">
            <HStack justify="between">
              <Text size="sm" weight="semibold">
                Route {index + 1}
              </Text>
              <Button
                appearance="ghost"
                tone="danger"
                size="sm"
                onClick={() => removeRoute(route.id)}
              >
                <IconTrash size={14} />
                Remove
              </Button>
            </HStack>
            <TextField
              label="Label"
              value={route.label}
              onValueChange={(value) => updateRoute(route.id, { label: value })}
            />
            <TextField
              label="Origin"
              value={route.origin}
              onValueChange={(value) => updateRoute(route.id, { origin: value })}
            />
            <TextField
              label="Destination"
              value={route.destination}
              onValueChange={(value) => updateRoute(route.id, { destination: value })}
            />
          </Stack>
        </Surface>
      ))}

      <Button appearance="subtle" onClick={addRoute} disabled={routes.length >= 4}>
        <IconPlus size={14} />
        Add route
      </Button>

      <Select
        label="Units"
        options={UNIT_OPTIONS}
        value={units}
        onValueChange={(key) => onConfigChange({ units: key === "metric" ? "metric" : "imperial" })}
      />

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

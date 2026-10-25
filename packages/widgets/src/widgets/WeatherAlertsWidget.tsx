import { useEffect, useState } from "react";
import {
  Button,
  HStack,
  Spinner,
  NumberInput,
  Surface,
  Stack,
  Switch,
  Text,
  TextField,
} from "@var-ui/react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { IconAlertTriangle, IconMapPin, IconRefresh } from "@tabler/icons-react";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";
import { searchLocations, type GeocodingResult } from "../services/weather";
import type { WidgetConfig, WidgetProps } from "../types";
import {
  formatAlertUntil,
  sortWeatherAlerts,
  WEATHER_ALERTS_COVERAGE_COPY,
  WEATHER_ALERTS_EMPTY_COPY,
  WEATHER_ALERTS_NEED_LOCATION_COPY,
  type WeatherAlertSeverity,
} from "./weatherAlerts";
import * as classes from "./WeatherAlertsWidget.styles";

export interface WeatherAlertsConfig extends WidgetConfig {
  location: string;
  latitude: number | null;
  longitude: number | null;
  maxAlerts: number;
  transparentBackground: boolean;
}

function severityClass(severity: WeatherAlertSeverity): string {
  switch (severity) {
    case "extreme":
    case "severe":
      return classes.severityDanger;
    case "moderate":
      return classes.severityWarning;
    case "minor":
      return classes.severityInfo;
    default:
      return classes.severityUnknown;
  }
}

function clampMaxAlerts(maxAlerts: number | undefined): number {
  return Math.min(15, Math.max(1, maxAlerts ?? 5));
}

export function WeatherAlertsWidget({ widget }: WidgetProps<WeatherAlertsConfig>) {
  const {
    location,
    latitude = null,
    longitude = null,
    maxAlerts,
    transparentBackground,
  } = widget.config;
  const { alerts, coverage, isLoading, error, isStale, lastUpdated, refresh } = useWeatherAlerts({
    latitude,
    longitude,
  });
  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;
  const visible = sortWeatherAlerts(alerts).slice(0, clampMaxAlerts(maxAlerts));

  if (latitude === null || longitude === null) {
    return (
      <div className={containerClass}>
        <div className={classes.empty}>
          <IconMapPin size={48} className={classes.emptyIcon} />
          <Text size="sm" tone="secondary">
            {WEATHER_ALERTS_NEED_LOCATION_COPY}
          </Text>
        </div>
      </div>
    );
  }

  if ((isLoading || coverage === null) && lastUpdated === null && !error) {
    return (
      <div className={containerClass}>
        <div className={classes.loading}>
          <Spinner size="lg" />
          <Text size="sm" tone="secondary">
            Loading alerts...
          </Text>
        </div>
      </div>
    );
  }

  if (error && lastUpdated === null) {
    return (
      <div className={containerClass}>
        <div className={classes.error}>
          <Text size="sm" style={{ color: "var(--var-ui-color-tone-danger-foreground)" }}>
            {error}
          </Text>
          <Button appearance="subtle" size="sm" onPress={refresh}>
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
          <IconAlertTriangle size={18} />
          {location || "Weather Alerts"}
        </Text>
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          error && (
            <Button appearance="ghost" size="sm" onPress={refresh}>
              <IconRefresh size={14} />
              Retry
            </Button>
          )
        )}
      </div>

      {coverage === "unavailable" ? (
        <Text size="sm" className={classes.quiet}>
          {WEATHER_ALERTS_COVERAGE_COPY}
        </Text>
      ) : coverage === "us" && visible.length === 0 ? (
        <Text size="sm" className={classes.quiet}>
          {WEATHER_ALERTS_EMPTY_COPY}
        </Text>
      ) : (
        <div className={classes.list}>
          {visible.map((alert) => {
            const until = alert.endsAt ? formatAlertUntil(alert.endsAt) : undefined;
            return (
              <Surface key={alert.id} className={classes.alert} padding="sm">
                <Text size="sm" className={`${classes.event} ${severityClass(alert.severity)}`}>
                  {alert.event}
                </Text>
                <Text size="sm" className={classes.headline} lineClamp={2}>
                  {alert.headline}
                </Text>
                {until && (
                  <Text size="xs" className={classes.until}>
                    {until}
                  </Text>
                )}
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
          error={error}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export function WeatherAlertsWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<WeatherAlertsConfig>) {
  const { location, maxAlerts, transparentBackground } = widget.config;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    searchLocations(debouncedQuery)
      .then((results) => {
        if (!cancelled) setSearchResults(results);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const selectLocation = (result: GeocodingResult) => {
    const locationString = [result.name, result.admin1, result.country].filter(Boolean).join(", ");
    onConfigChange({
      location: locationString,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <Stack gap="md">
      <div>
        <HStack gap="xs" align="end">
          <TextField
            label="Search Location"
            placeholder="Enter city name..."
            value={searchQuery}
            onChange={setSearchQuery}
            style={{ flex: 1 }}
          />
          {isSearching && <Spinner size="sm" />}
        </HStack>

        {searchResults.length > 0 && (
          <Surface className={classes.searchResults} padding="sm">
            <Stack gap="xs">
              {searchResults.map((result) => (
                <Button
                  key={result.id}
                  appearance="ghost"
                  size="sm"
                  onPress={() => selectLocation(result)}
                  className={classes.searchResult}
                >
                  <IconMapPin size={14} style={{ marginRight: 8 }} />
                  {result.name}
                  {result.admin1 && `, ${result.admin1}`}
                  {result.country && ` · ${result.country}`}
                </Button>
              ))}
            </Stack>
          </Surface>
        )}
      </div>

      {location && (
        <Surface padding="sm" className={classes.currentLocation}>
          <HStack gap="xs">
            <IconMapPin size={16} />
            <div>
              <Text size="xs" tone="secondary">
                Current Location
              </Text>
              <Text size="sm" weight="medium">
                {location}
              </Text>
            </div>
          </HStack>
        </Surface>
      )}

      <NumberInput
        label="Max alerts"
        minValue={1}
        maxValue={15}
        value={clampMaxAlerts(maxAlerts)}
        onChange={(value) =>
          onConfigChange({
            maxAlerts: typeof value === "number" ? clampMaxAlerts(value) : 5,
          })
        }
      />

      <HStack justify="between">
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

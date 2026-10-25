import { useState, useEffect, useMemo } from "react";
import {
  Text,
  Stack,
  TextField,
  Select,
  Switch,
  NumberInput,
  HStack,
  Spinner,
  Button,
  Surface,
} from "@var-ui/react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  IconSun,
  IconCloud,
  IconCloudRain,
  IconSnowflake,
  IconWind,
  IconDroplet,
  IconCloudStorm,
  IconRefresh,
  IconMapPin,
} from "@tabler/icons-react";
import type { WidgetProps, WidgetConfig, TextAlign } from "../types";
import { useOverlayPortalContainer } from "../overlayPortal";
import { useWeather } from "../hooks/useWeather";
import { useEntities } from "../hooks/useHomeAssistant";
import { useHomeAssistantWeather } from "../hooks/useHomeAssistantWeather";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { HA_MISSING_CONFIG_COPY, type HomeAssistantEntitySummary } from "./homeAssistant";
import { WEATHER_EMPTY_COPY, WEATHER_MISSING_CONFIG_COPY } from "./homeAssistantWeather";
import {
  searchLocations,
  getWeatherDescription,
  getWeatherIcon,
  fetchAirQuality,
  type GeocodingResult,
  type AirQualityData,
} from "../services/weather";
import * as classes from "./WeatherWidget.styles";
import { getWeatherSectionVisibility, getWeatherSizeTier } from "./weatherSizeTier";

export interface WeatherConfig extends WidgetConfig {
  location: string;
  latitude: number | null;
  longitude: number | null;
  units: "imperial" | "metric";
  showForecast: boolean;
  forecastDays: number;
  transparentBackground: boolean;
  showAirQuality: boolean;
  textAlign: TextAlign;
  source?: "local" | "homeAssistant";
  entityId?: string;
}

interface AqiBand {
  max: number;
  label: string;
  color: string;
}

const AQI_BANDS: AqiBand[] = [
  { max: 50, label: "Good", color: "#22c55e" },
  { max: 100, label: "Moderate", color: "#eab308" },
  { max: 150, label: "Unhealthy for Sensitive", color: "#f97316" },
  { max: 200, label: "Unhealthy", color: "#ef4444" },
  { max: 300, label: "Very Unhealthy", color: "#a855f7" },
  { max: Infinity, label: "Hazardous", color: "#7f1d1d" },
];

function getAqiBand(aqi: number): AqiBand {
  return AQI_BANDS.find((b) => aqi <= b.max) ?? AQI_BANDS[AQI_BANDS.length - 1];
}

const WeatherIcon = ({
  condition,
  size = 48,
  isDay = true,
}: {
  condition: string;
  size?: number;
  isDay?: boolean;
}) => {
  const iconProps = { size, strokeWidth: 1.5 };

  switch (condition.toLowerCase()) {
    case "sunny":
      return <IconSun {...iconProps} className={isDay ? classes.iconSunny : classes.iconMoon} />;
    case "rainy":
      return <IconCloudRain {...iconProps} className={classes.iconRainy} />;
    case "snowy":
      return <IconSnowflake {...iconProps} className={classes.iconSnowy} />;
    case "stormy":
      return <IconCloudStorm {...iconProps} className={classes.iconStormy} />;
    case "cloudy":
    default:
      return <IconCloud {...iconProps} className={classes.iconCloudy} />;
  }
};

export function WeatherWidget({ widget }: WidgetProps<WeatherConfig>) {
  const {
    latitude,
    longitude,
    units,
    showForecast,
    forecastDays,
    location,
    transparentBackground,
    showAirQuality,
    textAlign = "left",
    source = "local",
    entityId = "",
  } = widget.config;
  const useHa = source === "homeAssistant";
  const [aqData, setAqData] = useState<AirQualityData | null>(null);

  useEffect(() => {
    if (useHa || !showAirQuality || latitude === null || longitude === null) {
      setAqData(null);
      return;
    }
    fetchAirQuality(latitude, longitude)
      .then(setAqData)
      .catch(() => setAqData(null));
  }, [useHa, showAirQuality, latitude, longitude]);

  const locationInfo = useMemo(() => {
    if (!location) return undefined;
    // Parse stored location string (format: "City, State, Country")
    const parts = location.split(", ");
    return {
      name: parts[0] || location,
      admin1: parts[1],
      country: parts[2] || parts[1] || "",
    };
  }, [location]);

  const {
    data: localWeather,
    isLoading: localLoading,
    error: localError,
    refresh: refreshLocal,
    lastUpdated: localLastUpdated,
    isStale: localIsStale,
  } = useWeather({
    latitude: useHa ? null : latitude,
    longitude: useHa ? null : longitude,
    units,
    locationInfo,
  });
  const remote = useHomeAssistantWeather(useHa ? entityId : "", WEATHER_MISSING_CONFIG_COPY);

  const weather = useHa ? remote.data : localWeather;
  const isLoading = useHa ? remote.isLoading : localLoading;
  const error = useHa ? remote.error : localError;
  const refresh = useHa ? remote.refresh : refreshLocal;
  const lastUpdated = useHa ? remote.lastUpdated : localLastUpdated;
  const isStale = useHa ? remote.isStale : localIsStale;
  const status = useHa ? remote.status : null;

  const unitSystem = weather?.units ?? units;
  const tempUnit = unitSystem === "metric" ? "°C" : "°F";
  const windUnit = unitSystem === "metric" ? "km/h" : "mph";

  // No Home Assistant weather entity configured.
  if (useHa && !entityId) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconMapPin size={48} className={classes.emptyIcon} />
          <Text size="lg" weight="medium">
            No Weather Entity Set
          </Text>
          <Text size="sm" tone="secondary">
            {WEATHER_EMPTY_COPY}
          </Text>
        </div>
      </div>
    );
  }

  // Home Assistant is not configured.
  if (useHa && status === 501) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <Text size="lg" weight="medium">
            Home Assistant isn't connected
          </Text>
          <Text size="sm" tone="secondary">
            {error ?? WEATHER_MISSING_CONFIG_COPY}
          </Text>
        </div>
      </div>
    );
  }

  // No location configured
  if (!useHa && (!latitude || !longitude)) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconMapPin size={48} className={classes.emptyIcon} />
          <Text size="lg" weight="medium">
            No Location Set
          </Text>
          <Text size="sm" tone="secondary">
            Configure a location in widget settings
          </Text>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !weather) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.loading}>
          <Spinner size="lg" />
          <Text size="sm" tone="secondary">
            Loading weather...
          </Text>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !weather) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
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

  if (!weather) return null;

  const iconCondition = getWeatherIcon(weather.current.weatherCode);
  const description = getWeatherDescription(weather.current.weatherCode);

  const alignClass =
    textAlign === "center"
      ? classes.alignCenter
      : textAlign === "right"
        ? classes.alignRight
        : classes.alignLeft;

  const { w, h } = widget.layout;
  const tier = getWeatherSizeTier(w, h);
  const sections = getWeatherSectionVisibility(tier);
  const isCompact = tier === "compact";
  const showWeeklyForecast = showForecast && sections.showWeekly;
  const showCompactLocation = isCompact && w >= 3;

  return (
    <div
      className={`${classes.container} ${transparentBackground ? classes.transparent : ""} ${alignClass} ${isCompact ? classes.compact : ""}`}
    >
      {(sections.showLocation || showCompactLocation) && (
        <div className={classes.header}>
          <Text className={classes.location}>
            {weather.location.name}
            {weather.location.admin1 && `, ${weather.location.admin1}`}
          </Text>
          {isLoading && <Spinner size="sm" />}
        </div>
      )}
      {sections.showUpdated && (
        <WidgetDataStatus
          widgetId={widget.id}
          lastUpdated={lastUpdated}
          isStale={isStale}
          error={error}
          isLoading={isLoading}
          align={textAlign}
        />
      )}

      <div className={classes.current}>
        <div className={classes.mainTemp}>
          <WeatherIcon
            condition={iconCondition}
            size={isCompact ? 36 : 64}
            isDay={weather.current.isDay}
          />
          <div>
            <Text className={classes.temperature}>
              {weather.current.temperature}
              {tempUnit}
            </Text>
            <Text className={classes.condition}>{description}</Text>
          </div>
        </div>

        {sections.showDetails && (
          <div className={classes.details}>
            <div className={classes.detailItem}>
              <IconDroplet size={16} />
              <Text size="sm">{weather.current.humidity}%</Text>
            </div>
            <div className={classes.detailItem}>
              <IconWind size={16} />
              <Text size="sm">
                {weather.current.windSpeed} {windUnit}
              </Text>
            </div>
            <div className={classes.detailItem}>
              <Text size="sm" tone="secondary">
                Feels {weather.current.apparentTemperature}°
              </Text>
            </div>
          </div>
        )}

        {sections.showDetails &&
          showAirQuality &&
          aqData !== null &&
          (() => {
            const band = getAqiBand(aqData.usAqi);
            return (
              <div className={classes.aqiBadge} style={{ borderColor: band.color }}>
                <span className={classes.aqiDot} style={{ background: band.color }} />
                <Text size="sm" weight="semibold" style={{ color: band.color }}>
                  AQI {aqData.usAqi}
                </Text>
                <Text size="sm" tone="secondary">
                  {band.label}
                </Text>
              </div>
            );
          })()}
      </div>

      {sections.showHourly && weather.hourly.length > 0 && (
        <div className={classes.hourlySection}>
          <Text size="sm" weight="semibold" tone="secondary">
            Next 24 hours
          </Text>
          <div className={classes.hourly}>
            {weather.hourly.map((hour, index) => {
              const hourLabel = new Date(hour.time).toLocaleTimeString("en-US", {
                hour: "numeric",
                hour12: true,
              });
              const hourIcon = getWeatherIcon(hour.weatherCode);
              return (
                <div key={index} className={classes.forecastHour}>
                  <Text size="sm" weight="medium">
                    {hourLabel}
                  </Text>
                  <WeatherIcon condition={hourIcon} size={22} isDay={hour.isDay} />
                  <Text size="sm">
                    {hour.temperature}
                    {tempUnit}
                  </Text>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showWeeklyForecast && weather.daily.length > 1 && (
        <div className={classes.forecast}>
          {weather.daily.slice(1, forecastDays + 1).map((day, index) => {
            const dayName = new Date(day.date).toLocaleDateString("en-US", { weekday: "long" });
            const dayIcon = getWeatherIcon(day.weatherCode);
            return (
              <div key={index} className={classes.forecastDay}>
                <Text size="sm" weight="medium" className={classes.forecastDayName}>
                  {dayName}
                </Text>
                <div className={classes.forecastDayBody}>
                  <WeatherIcon condition={dayIcon} size={26} />
                  <div className={classes.forecastDayTemps}>
                    <Text size="sm" weight="medium" as="span">
                      {day.tempMax}°
                    </Text>
                    <Text size="sm" tone="secondary" as="span">
                      /
                    </Text>
                    <Text size="sm" tone="secondary" as="span">
                      {day.tempMin}°
                    </Text>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WeatherWidgetSettings({ widget, onConfigChange }: WidgetProps<WeatherConfig>) {
  const portalContainer = useOverlayPortalContainer();
  const {
    location,
    units,
    showForecast,
    forecastDays,
    showAirQuality,
    textAlign = "left",
    source = "local",
    entityId = "",
  } = widget.config;
  const {
    entities: weatherEntities,
    status: entitiesStatus,
    error: entitiesError,
  } = useEntities("weather", WEATHER_MISSING_CONFIG_COPY);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for locations when query changes
  const handleSearch = async () => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchLocations(debouncedQuery);
      setSearchResults(results);
    } catch (err) {
      console.error("Location search failed:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger search on debounced query change
  useState(() => {
    handleSearch();
  });

  // Effect to search when debouncedQuery changes
  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      setIsSearching(true);
      searchLocations(value)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  };

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
      <Select
        label="Source"
        options={[
          { id: "local", label: "Open-Meteo" },
          { id: "homeAssistant", label: "Home Assistant" },
        ]}
        selectedKey={source}
        onSelectionChange={(value) => {
          if (value === "local" || value === "homeAssistant") onConfigChange({ source: value });
        }}
        portalContainer={portalContainer}
      />

      {source === "homeAssistant" ? (
        <Stack gap="xs">
          <Select
            label="Weather Entity"
            placeholder="Select a weather entity…"
            options={weatherEntities.map((entity: HomeAssistantEntitySummary) => ({
              id: entity.entityId,
              label: `${entity.name} (${entity.entityId})`,
            }))}
            selectedKey={entityId || null}
            onSelectionChange={(value) => {
              if (typeof value === "string") onConfigChange({ entityId: value });
            }}
            portalContainer={portalContainer}
          />
          {entitiesStatus === 501 && (
            <Text size="xs" tone="secondary">
              {entitiesError ?? HA_MISSING_CONFIG_COPY}
            </Text>
          )}
        </Stack>
      ) : (
        <>
          <div>
            <TextField
              label="Search Location"
              placeholder="Enter city name..."
              value={searchQuery}
              onChange={(value) => handleQueryChange(value)}
            />
            {isSearching && <Spinner size="sm" />}

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
                  <Text size="sm" tone="secondary">
                    Current Location
                  </Text>
                  <Text size="sm" weight="medium">
                    {location}
                  </Text>
                </div>
              </HStack>
            </Surface>
          )}

          <Select
            label="Temperature Units"
            options={[
              { id: "imperial", label: "Fahrenheit (°F)" },
              { id: "metric", label: "Celsius (°C)" },
            ]}
            selectedKey={units}
            onSelectionChange={(value) =>
              onConfigChange({ units: (value as "imperial" | "metric") || "imperial" })
            }
            portalContainer={portalContainer}
          />
        </>
      )}

      <HStack justify="between">
        <Text size="sm">Show Forecast</Text>
        <Switch
          isSelected={showForecast}
          onChange={(value) => onConfigChange({ showForecast: value })}
        />
      </HStack>

      {showForecast && (
        <NumberInput
          label="Forecast Days"
          minValue={1}
          maxValue={6}
          value={forecastDays}
          onChange={(value) => onConfigChange({ forecastDays: Number(value) || 5 })}
        />
      )}

      {source !== "homeAssistant" && (
        <HStack justify="between">
          <Text size="sm">Show Air Quality (US AQI)</Text>
          <Switch
            isSelected={showAirQuality ?? false}
            onChange={(value) => onConfigChange({ showAirQuality: value })}
          />
        </HStack>
      )}
      <Select
        label="Text Alignment"
        options={[
          { id: "left", label: "Left" },
          { id: "center", label: "Center" },
          { id: "right", label: "Right" },
        ]}
        selectedKey={textAlign}
        onSelectionChange={(value) => onConfigChange({ textAlign: (value as TextAlign) || "left" })}
        portalContainer={portalContainer}
      />
    </Stack>
  );
}

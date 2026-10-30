import {
  Badge,
  Button,
  Card,
  EmptyState,
  HStack,
  NumberInput,
  SimpleGrid,
  Slider,
  Spinner,
  Stack,
  Switch,
  Text,
} from "@var-ui/react";
import { IconBulb, IconRefresh } from "@tabler/icons-react";
import { useState, type ReactNode } from "react";
import type { WidgetConfig, WidgetProps } from "../types";
import { WidgetDataStatus } from "../chrome/WidgetDataStatus";
import { useEntityList, useHomeAssistantService } from "../hooks/useHomeAssistant";
import { AddEntitySelect, SelectedEntityRow } from "./AddEntitySelect";
import {
  DEVICES_EMPTY_COPY,
  DEVICES_MISSING_CONFIG_COPY,
  DEVICE_DOMAINS,
  applyDeviceOverride,
  deviceService,
  deviceStatusLabel,
  getDevicesSizeTier,
  type DeviceDomain,
  type DeviceOverride,
  type HomeAssistantDevice,
} from "./homeAssistantDevice";
import * as classes from "./DevicesWidget.styles";
import { ErrorText } from "../ErrorText";

export interface DevicesConfig extends WidgetConfig {
  domains: DeviceDomain[];
  entityIds: string[];
  showBrightness: boolean;
  columns: number;
  transparentBackground: boolean;
}

const DOMAIN_LABELS: Record<DeviceDomain, string> = {
  light: "Lights",
  switch: "Switches & outlets",
  input_boolean: "Input booleans",
  fan: "Fans",
};

type DeviceOverrideMap = Record<string, DeviceOverride>;

function gridColumns(columns: number): 1 | 2 | 3 | 4 {
  const rounded = Math.min(4, Math.max(1, Math.round(columns)));
  if (rounded === 1 || rounded === 3 || rounded === 4) return rounded;
  return 2;
}

function sliderNumber(value: number | number[]): number {
  return typeof value === "number" ? value : (value[0] ?? 1);
}

function DeviceShell({ transparent, children }: { transparent: boolean; children: ReactNode }) {
  return (
    <Stack gap="sm" className={`${classes.container} ${transparent ? classes.transparent : ""}`}>
      {children}
    </Stack>
  );
}

export function DevicesWidget({ widget, isEditing }: WidgetProps<DevicesConfig>) {
  const {
    entityIds = [],
    showBrightness = true,
    columns = 2,
    transparentBackground = false,
  } = widget.config;
  const ids = entityIds.filter(Boolean);
  const { entities, isLoading, error, status, lastUpdated, isStale, refresh } =
    useEntityList<HomeAssistantDevice>(ids, { fetchFailureCopy: DEVICES_MISSING_CONFIG_COPY });
  const callService = useHomeAssistantService(DEVICES_MISSING_CONFIG_COPY);
  const [overrides, setOverrides] = useState<DeviceOverrideMap>({});
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);

  const byId = new Map(entities.map((entity) => [entity.entityId, entity]));
  const merged = (entityId: string): HomeAssistantDevice | null => {
    const base = byId.get(entityId);
    if (!base) return null;
    return applyDeviceOverride(base, overrides[entityId]);
  };

  const tier = getDevicesSizeTier(widget.layout.w, widget.layout.h);
  const columnCount = gridColumns(columns);
  const showBrightnessControls = tier === "full" && showBrightness;
  const onCount = ids.filter((entityId) => merged(entityId)?.isOn).length;

  const clearOverride = (entityId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[entityId];
      return next;
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[entityId];
      return next;
    });
  };

  const toggle = async (device: HomeAssistantDevice, nextOn: boolean) => {
    if (!device.available || pendingId === device.entityId || nextOn === device.isOn) return;
    setControlError(null);
    setPendingId(device.entityId);
    setOverrides((prev) => ({
      ...prev,
      [device.entityId]: { ...prev[device.entityId], isOn: nextOn },
    }));
    try {
      await callService(device.domain, deviceService(device.domain, nextOn), device.entityId, {});
    } catch (err) {
      setControlError(err instanceof Error ? err.message : DEVICES_MISSING_CONFIG_COPY);
    } finally {
      await refresh();
      clearOverride(device.entityId);
      setPendingId(null);
    }
  };

  const commitBrightness = async (device: HomeAssistantDevice, value: number) => {
    if (!device.available || pendingId === device.entityId) return;
    const pct = Math.min(100, Math.max(1, Math.round(value)));
    setControlError(null);
    setPendingId(device.entityId);
    setOverrides((prev) => ({
      ...prev,
      [device.entityId]: { ...prev[device.entityId], isOn: true, brightnessPct: pct },
    }));
    try {
      await callService("light", "turn_on", device.entityId, { brightness_pct: pct });
    } catch (err) {
      setControlError(err instanceof Error ? err.message : DEVICES_MISSING_CONFIG_COPY);
    } finally {
      await refresh();
      clearOverride(device.entityId);
      setPendingId(null);
    }
  };

  if (ids.length === 0) {
    return (
      <DeviceShell transparent={transparentBackground}>
        <EmptyState
          className={classes.empty}
          icon={<IconBulb size={24} />}
          title={DEVICES_EMPTY_COPY}
        />
      </DeviceShell>
    );
  }

  if (status === 501) {
    return (
      <DeviceShell transparent={transparentBackground}>
        <EmptyState
          className={classes.empty}
          title="Home Assistant isn't connected"
          description={error ?? DEVICES_MISSING_CONFIG_COPY}
        />
      </DeviceShell>
    );
  }

  return (
    <DeviceShell transparent={transparentBackground}>
      {(error || controlError) && (
        <HStack justify="between" align="center" gap="sm">
          <ErrorText size="sm">{controlError ?? error}</ErrorText>
          <Button appearance="subtle" size="sm" onPress={refresh} isDisabled={isLoading}>
            <IconRefresh size={14} />
            Retry
          </Button>
        </HStack>
      )}

      {tier !== "compact" && (
        <HStack justify="between" align="center" gap="sm">
          <Text size="sm" tone="secondary">
            {onCount} on
          </Text>
          {!isEditing && (
            <WidgetDataStatus
              widgetId={widget.id}
              lastUpdated={lastUpdated}
              isStale={isStale}
              error={error}
              isLoading={isLoading}
            />
          )}
        </HStack>
      )}

      <SimpleGrid cols={columnCount} spacing="sm" className={classes.grid}>
        {ids.map((entityId) => {
          const device = merged(entityId);
          if (!device) {
            return (
              <Card key={entityId} className={classes.card}>
                <HStack justify="center">
                  <Spinner size="sm" />
                </HStack>
              </Card>
            );
          }
          const pending = pendingId === device.entityId;
          const brightnessValue = drafts[entityId] ?? device.brightnessPct ?? 100;
          const cardClass = [
            classes.card,
            device.isOn ? classes.cardOn : "",
            pending ? classes.cardPending : "",
            device.available ? "" : classes.cardUnavailable,
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <Card key={entityId} className={cardClass}>
              <Stack gap="sm">
                <HStack justify="between" align="center" gap="sm">
                  <Stack gap="none" className={classes.toggleRow}>
                    <Switch
                      aria-label={`Toggle ${device.name}`}
                      isSelected={device.isOn}
                      isDisabled={!device.available || pending}
                      onChange={(nextOn) => void toggle(device, nextOn)}
                    >
                      <Stack gap="none">
                        <Text as="span" weight="semibold" lineClamp={1}>
                          {device.name}
                        </Text>
                        <Text as="span" size="sm" tone="secondary">
                          {deviceStatusLabel(device)}
                        </Text>
                      </Stack>
                    </Switch>
                  </Stack>
                  {device.domain === "fan" && device.percentage !== null && (
                    <Badge tone="neutral" appearance="subtle">
                      {Math.round(device.percentage)}%
                    </Badge>
                  )}
                </HStack>
                {showBrightnessControls &&
                  device.domain === "light" &&
                  device.isOn &&
                  device.available && (
                    <HStack gap="sm" align="center">
                      <Slider
                        className={classes.brightness}
                        aria-label={`Brightness for ${device.name}`}
                        minValue={1}
                        maxValue={100}
                        step={1}
                        value={brightnessValue}
                        showOutput={false}
                        isDisabled={pending}
                        onChange={(value) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [entityId]: sliderNumber(value),
                          }))
                        }
                        onChangeEnd={(value) => void commitBrightness(device, sliderNumber(value))}
                      />
                      <Text size="xs" tone="secondary">
                        {Math.round(brightnessValue)}%
                      </Text>
                    </HStack>
                  )}
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>

      {tier === "compact" && !isEditing && (
        <WidgetDataStatus
          widgetId={widget.id}
          lastUpdated={lastUpdated}
          isStale={isStale}
          error={error}
          isLoading={isLoading}
        />
      )}
    </DeviceShell>
  );
}

export function DevicesWidgetSettings({ widget, onConfigChange }: WidgetProps<DevicesConfig>) {
  const {
    domains = [...DEVICE_DOMAINS],
    entityIds = [],
    showBrightness = true,
    columns = 2,
    transparentBackground = false,
  } = widget.config;

  const toggleDomain = (domain: DeviceDomain) => {
    const next = domains.includes(domain)
      ? domains.filter((value) => value !== domain)
      : [...domains, domain];
    onConfigChange({ domains: next });
  };

  return (
    <Stack gap="md">
      <Text size="sm">Device types</Text>
      {DEVICE_DOMAINS.map((domain) => (
        <HStack key={domain} justify="between" align="center">
          <Text size="sm">{DOMAIN_LABELS[domain]}</Text>
          <Switch
            aria-label={DOMAIN_LABELS[domain]}
            isSelected={domains.includes(domain)}
            onChange={() => toggleDomain(domain)}
          />
        </HStack>
      ))}

      <AddEntitySelect
        domains={domains}
        value={entityIds}
        onAdd={(entityId) => onConfigChange({ entityIds: [...entityIds, entityId] })}
        failureCopy={DEVICES_MISSING_CONFIG_COPY}
        label="Add device"
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

      <NumberInput
        label="Columns"
        minValue={1}
        maxValue={4}
        value={columns}
        onChange={(value) => {
          const next = Number(value);
          onConfigChange({ columns: Number.isFinite(next) ? Math.min(4, Math.max(1, next)) : 2 });
        }}
      />
      <HStack gap="sm" align="center" justify="between">
        <Text size="sm">Show brightness slider (when large)</Text>
        <Switch
          aria-label="Show brightness slider"
          isSelected={showBrightness}
          onChange={(value) => onConfigChange({ showBrightness: value })}
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

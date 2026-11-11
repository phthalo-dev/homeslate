import { Stack, Text, HStack, Switch } from "@var-ui/react";
import type { WidgetProps, WidgetConfig } from "../types";
import { useAlarms } from "../alarms/AlarmsContext";
import { AlarmListEditor } from "../alarms/AlarmListEditor";
import * as classes from "./AlarmsWidget.styles";

export interface AlarmsConfig extends WidgetConfig {
  transparentBackground: boolean;
}

export function AlarmsWidget({ widget }: WidgetProps<AlarmsConfig>) {
  const { transparentBackground } = widget.config;
  const { provided, alarms, onAlarmsChange, readOnly } = useAlarms();

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      {provided ? (
        <AlarmListEditor
          alarms={alarms}
          onChange={onAlarmsChange ?? (() => {})}
          readOnly={readOnly}
        />
      ) : (
        <Stack className={classes.empty} gap="xs">
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            Add alarms in Display Settings
          </Text>
        </Stack>
      )}
    </div>
  );
}

export function AlarmsWidgetSettings({ widget, onConfigChange }: WidgetProps<AlarmsConfig>) {
  const { transparentBackground } = widget.config;
  const { provided, alarms, onAlarmsChange, readOnly } = useAlarms();

  return (
    <Stack gap="md">
      <Text size="xs" tone="secondary">
        Manage recurring alarms directly on the widget, or here.
      </Text>

      <HStack justify="between">
        <Text size="sm">Transparent background</Text>
        <Switch
          aria-label="Transparent background"
          checked={transparentBackground}
          onCheckedChange={(value) => onConfigChange({ transparentBackground: value })}
        />
      </HStack>

      {provided && (
        <AlarmListEditor
          alarms={alarms}
          onChange={onAlarmsChange ?? (() => {})}
          readOnly={readOnly}
        />
      )}
    </Stack>
  );
}

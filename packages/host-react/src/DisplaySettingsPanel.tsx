import { useState, type JSX, type ReactNode } from "react";
import { Button, HStack, PinInput, Select, Stack, Surface, Switch, Text } from "@var-ui/react";
import { AlarmListEditor } from "@homeslate/widgets";
import { HOLIDAY_PREVIEW_OPTIONS } from "@homeslate/display";
import type { AlarmDefinition, DisplayDocument, HolidayId } from "@homeslate/schema";
import { errorMessage } from "./api";

const INTERVAL_OPTIONS = [
  { id: "15000", label: "15 seconds" },
  { id: "30000", label: "30 seconds" },
  { id: "60000", label: "1 minute" },
  { id: "300000", label: "5 minutes" },
  { id: "600000", label: "10 minutes" },
  { id: "1800000", label: "30 minutes" },
];

const HOLIDAY_OPTIONS = [
  { id: "auto", label: "Auto (today)" },
  ...HOLIDAY_PREVIEW_OPTIONS.map((option) => ({ id: option.value, label: option.label })),
];

function Section(props: { title: string; children: ReactNode }): JSX.Element {
  const { title, children } = props;
  return (
    <Surface padding="md">
      <Stack gap="md">
        <Text weight="semibold">{title}</Text>
        {children}
      </Stack>
    </Surface>
  );
}

export function DisplaySettingsPanel(props: {
  document: DisplayDocument;
  onChange: (next: DisplayDocument) => void;
  passcodeEnabled: boolean;
  onSetPasscode: (passcode: string | null) => Promise<void>;
}): JSX.Element {
  const { document, onChange, passcodeEnabled, onSetPasscode } = props;
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSaving, setPinSaving] = useState(false);

  const visibleViewCount = document.views.filter((view) => !view.hidden).length;
  const rotation = document.rotation;

  const patchSettings = (patch: Partial<DisplayDocument["settings"]>) => {
    onChange({ ...document, settings: { ...document.settings, ...patch } });
  };
  const patchRotation = (patch: Partial<DisplayDocument["rotation"]>) => {
    onChange({ ...document, rotation: { ...rotation, ...patch } });
  };

  const savePin = async (value: string | null) => {
    if (value !== null && !/^\d{4}$/.test(value)) {
      setPinError("PIN must be exactly 4 digits");
      return;
    }
    setPinSaving(true);
    setPinError(null);
    try {
      await onSetPasscode(value);
      setPin("");
    } catch (cause) {
      setPinError(errorMessage(cause));
    } finally {
      setPinSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Section title="Auto-Rotate">
        <HStack justify="between" align="center" gap="md">
          <Stack gap="xs">
            <Text size="sm">Auto-rotate views</Text>
            <Text size="xs" tone="secondary">
              Automatically cycle through visible views.
            </Text>
          </Stack>
          <Switch
            isSelected={rotation.enabled}
            isDisabled={visibleViewCount <= 1}
            aria-label="Auto-rotate views"
            onChange={(enabled) => patchRotation({ enabled })}
          />
        </HStack>
        {rotation.enabled && visibleViewCount > 1 && (
          <Select
            aria-label="Rotation interval"
            options={INTERVAL_OPTIONS}
            selectedKey={String(rotation.intervalMs)}
            onSelectionChange={(key) => {
              if (key != null) patchRotation({ intervalMs: Number(key) });
            }}
          />
        )}
        {visibleViewCount <= 1 && (
          <Text size="xs" tone="secondary">
            {document.views.length <= 1
              ? "Add a second view to enable auto-rotation."
              : "Show at least two views to enable auto-rotation."}
          </Text>
        )}
      </Section>

      <Section title="Kiosk">
        <HStack justify="between" align="center" gap="md">
          <Stack gap="xs">
            <Text size="sm">Keep the screen awake</Text>
            <Text size="xs" tone="secondary">
              Stops the kiosk display from sleeping while this board is open. On by default.
            </Text>
          </Stack>
          <Switch
            isSelected={document.settings.wakeLockEnabled !== false}
            aria-label="Keep the screen awake"
            onChange={(enabled) => patchSettings({ wakeLockEnabled: enabled })}
          />
        </HStack>
      </Section>

      <Section title="Sticky Notes">
        <HStack justify="between" align="center" gap="md">
          <Stack gap="xs">
            <Text size="sm">Enable sticky notes</Text>
            <Text size="xs" tone="secondary">
              Show a "+" button to add floating notes on each view in the editor and kiosk.
            </Text>
          </Stack>
          <Switch
            isSelected={document.settings.stickyNotesEnabled ?? false}
            aria-label="Enable sticky notes"
            onChange={(enabled) => patchSettings({ stickyNotesEnabled: enabled })}
          />
        </HStack>
      </Section>

      <Section title="Alarms">
        <Text size="xs" tone="secondary">
          Recurring alarms ring on this display with sound. Snooze for 5, 10, or 15 minutes.
        </Text>
        <AlarmListEditor
          alarms={document.alarms ?? []}
          onChange={(alarms: AlarmDefinition[]) => onChange({ ...document, alarms })}
        />
        <HStack justify="between" align="center" gap="md">
          <Stack gap="xs">
            <Text size="sm">Enable voice commands</Text>
            <Text size="xs" tone="secondary">
              Say dismiss or snooze when an alarm rings. Microphone permission is requested on the
              display (Chromium / HTTPS recommended).
            </Text>
          </Stack>
          <Switch
            isSelected={document.settings.voiceEnabled ?? false}
            aria-label="Enable voice commands"
            onChange={(enabled) => patchSettings({ voiceEnabled: enabled })}
          />
        </HStack>
      </Section>

      <Section title="Holiday Effects">
        <HStack justify="between" align="center" gap="md">
          <Stack gap="xs">
            <Text size="sm">Enable holiday UI</Text>
            <Text size="xs" tone="secondary">
              Show holiday-specific visuals on matching dates (for example: St. Patrick&apos;s Day).
            </Text>
          </Stack>
          <Switch
            isSelected={document.settings.holidayEffectsEnabled ?? false}
            aria-label="Enable holiday UI"
            onChange={(enabled) => patchSettings({ holidayEffectsEnabled: enabled })}
          />
        </HStack>
        <Stack gap="xs">
          <Text size="sm">Preview holiday</Text>
          <Text size="xs" tone="secondary">
            Force a holiday theme for testing. Auto uses the current date.
          </Text>
          <Select
            aria-label="Preview holiday"
            options={HOLIDAY_OPTIONS}
            selectedKey={document.settings.holidayPreviewId ?? "auto"}
            onSelectionChange={(key) => {
              const next: HolidayId | undefined =
                key == null || key === "auto" ? undefined : (String(key) as HolidayId);
              patchSettings({ holidayPreviewId: next });
            }}
          />
        </Stack>
      </Section>

      <Section title="Viewer Passcode">
        <HStack justify="between" align="center" gap="md">
          <Stack gap="xs">
            <Text size="sm">{passcodeEnabled ? "Passcode is set" : "No passcode"}</Text>
            <Text size="xs" tone="secondary">
              Require a 4-digit PIN before the display can be viewed.
            </Text>
          </Stack>
          {passcodeEnabled && (
            <Button
              appearance="ghost"
              tone="danger"
              size="sm"
              isPending={pinSaving}
              onPress={() => void savePin(null)}
            >
              Remove PIN
            </Button>
          )}
        </HStack>
        <HStack gap="sm" align="center">
          <PinInput
            length={4}
            type="numeric"
            aria-label="Viewer passcode"
            value={pin}
            errorMessage={pinError ?? undefined}
            onChange={(value) => {
              setPin(value);
              setPinError(null);
            }}
          />
          <Button
            size="sm"
            isDisabled={pin.length !== 4}
            isPending={pinSaving}
            onPress={() => void savePin(pin)}
          >
            {passcodeEnabled ? "Change PIN" : "Enable PIN"}
          </Button>
        </HStack>
      </Section>
    </Stack>
  );
}

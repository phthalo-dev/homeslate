import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type JSX,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Button,
  Heading,
  HStack,
  PinInput,
  Select,
  Stack,
  Surface,
  Switch,
  Text,
} from "@var-ui/react";
import { AlarmListEditor } from "@homeslate/widgets";
import { HOLIDAY_PREVIEW_OPTIONS } from "@homeslate/display";
import type { AlarmDefinition, DisplayDocument, HolidayId } from "@homeslate/schema";
import { errorMessage } from "./api";
import * as classes from "./DisplaySettingsPanel.styles";

const INTERVAL_OPTIONS = [
  { value: "15000", label: "15 seconds" },
  { value: "30000", label: "30 seconds" },
  { value: "60000", label: "1 minute" },
  { value: "300000", label: "5 minutes" },
  { value: "600000", label: "10 minutes" },
  { value: "1800000", label: "30 minutes" },
];

const HOLIDAY_OPTIONS = [
  { value: "auto", label: "Auto (today)" },
  ...HOLIDAY_PREVIEW_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

/** A card that groups related settings; rows inside are separated by hairlines. */
function Section(props: { title: string; description?: string; children: ReactNode }): JSX.Element {
  const { title, description, children } = props;
  return (
    <Surface padding="none">
      <div className={classes.sectionHeader}>
        <Heading level={3} size="sm">
          {title}
        </Heading>
        {description ? (
          <Text size="sm" tone="secondary" className={classes.sectionDescription}>
            {description}
          </Text>
        ) : null}
      </div>
      <div>{children}</div>
    </Surface>
  );
}

/** One setting: label and help on the left, its control on the right. */
function SettingRow(props: {
  label: string;
  description?: ReactNode;
  /** A node, or a function that receives the id of the description to wire up as aria-describedby. */
  control?: ReactNode | ((descriptionId: string) => ReactNode);
  children?: ReactNode;
}): JSX.Element {
  const { label, description, control, children } = props;
  const descriptionId = useId();
  // A bare Switch gets its help text announced with it; wrapped controls keep their own wiring.
  const wiredControl =
    typeof control === "function"
      ? control(descriptionId)
      : description && isValidElement(control) && control.type === Switch
        ? cloneElement(control as ReactElement<{ "aria-describedby"?: string }>, {
            "aria-describedby": descriptionId,
          })
        : control;
  return (
    <div className={classes.row}>
      <HStack justify="between" align="center" gap="lg" wrap>
        <Stack gap="xs" className={classes.rowText}>
          <Text weight="medium">{label}</Text>
          {description ? (
            <Text size="sm" tone="secondary" id={descriptionId}>
              {description}
            </Text>
          ) : null}
        </Stack>
        {wiredControl}
      </HStack>
      {children}
    </div>
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
      <Section title="Playback" description="How the kiosk cycles through views and stays on.">
        <SettingRow
          label="Auto-rotate views"
          description={
            visibleViewCount <= 1
              ? document.views.length <= 1
                ? "Add a second view to enable auto-rotation."
                : "Show at least two views to enable auto-rotation."
              : "Automatically cycle through visible views."
          }
          control={(descId) => (
            <HStack gap="md" align="center">
              {rotation.enabled && visibleViewCount > 1 && (
                <div className={classes.narrowField}>
                  <Select
                    aria-label="Rotation interval"
                    options={INTERVAL_OPTIONS}
                    value={String(rotation.intervalMs)}
                    onValueChange={(key) => {
                      if (key != null) patchRotation({ intervalMs: Number(key) });
                    }}
                  />
                </div>
              )}
              <Switch
                checked={rotation.enabled}
                disabled={visibleViewCount <= 1}
                aria-label="Auto-rotate views"
                aria-describedby={descId}
                onCheckedChange={(enabled) => patchRotation({ enabled })}
              />
            </HStack>
          )}
        />
        <SettingRow
          label="Keep the screen awake"
          description="Stops the kiosk display from sleeping while this board is open. On by default."
          control={
            <Switch
              checked={document.settings.wakeLockEnabled !== false}
              aria-label="Keep the screen awake"
              onCheckedChange={(enabled) => patchSettings({ wakeLockEnabled: enabled })}
            />
          }
        />
      </Section>

      <Section title="Display" description="Optional extras shown on the board.">
        <SettingRow
          label="Sticky notes"
          description={
            'Show a "+" button to add floating notes on each view in the editor and kiosk.'
          }
          control={
            <Switch
              checked={document.settings.stickyNotesEnabled ?? false}
              aria-label="Sticky notes"
              onCheckedChange={(enabled) => patchSettings({ stickyNotesEnabled: enabled })}
            />
          }
        />
        <SettingRow
          label="Holiday effects"
          description="Show holiday-specific visuals on matching dates (for example: St. Patrick's Day)."
          control={
            <Switch
              checked={document.settings.holidayEffectsEnabled ?? false}
              aria-label="Holiday effects"
              onCheckedChange={(enabled) => patchSettings({ holidayEffectsEnabled: enabled })}
            />
          }
        />
        <SettingRow
          label="Preview holiday"
          description="Force a holiday theme for testing. Turn on holiday effects to use it."
          control={
            <div className={classes.narrowField}>
              <Select
                aria-label="Preview holiday"
                disabled={!(document.settings.holidayEffectsEnabled ?? false)}
                options={HOLIDAY_OPTIONS}
                value={document.settings.holidayPreviewId ?? "auto"}
                onValueChange={(key) => {
                  const next: HolidayId | undefined =
                    key == null || key === "auto" ? undefined : (String(key) as HolidayId);
                  patchSettings({ holidayPreviewId: next });
                }}
              />
            </div>
          }
        />
      </Section>

      <Section
        title="Alarms"
        description="Recurring alarms ring on this display with sound. Snooze for 5, 10, or 15 minutes."
      >
        <SettingRow label="Alarm schedule">
          <div className={classes.below}>
            <AlarmListEditor
              alarms={document.alarms ?? []}
              onChange={(alarms: AlarmDefinition[]) => onChange({ ...document, alarms })}
            />
          </div>
        </SettingRow>
        <SettingRow
          label="Voice commands"
          description="Say dismiss or snooze when an alarm rings. Microphone permission is requested on the display (Chromium / HTTPS recommended)."
          control={
            <Switch
              checked={document.settings.voiceEnabled ?? false}
              aria-label="Voice commands"
              onCheckedChange={(enabled) => patchSettings({ voiceEnabled: enabled })}
            />
          }
        />
      </Section>

      <Section title="Access" description="Control who can open this display.">
        <SettingRow
          label={passcodeEnabled ? "Passcode is set" : "Viewer passcode"}
          description={`Require a 4-digit PIN before the display can be viewed. Enter 4 digits to ${
            passcodeEnabled ? "change the PIN" : "require a PIN on the kiosk"
          }.`}
          control={
            passcodeEnabled ? (
              <Button
                appearance="ghost"
                tone="danger"
                size="sm"
                loading={pinSaving}
                onClick={() => void savePin(null)}
              >
                Remove PIN
              </Button>
            ) : undefined
          }
        >
          <HStack gap="sm" align="center" className={classes.below}>
            <PinInput
              length={4}
              characters="numeric"
              aria-label="Viewer passcode"
              value={pin}
              errorMessage={pinError ?? undefined}
              onValueChange={(value) => {
                setPin(value);
                setPinError(null);
              }}
            />
            <Button
              size="sm"
              disabled={pin.length !== 4}
              loading={pinSaving}
              onClick={() => void savePin(pin)}
            >
              {passcodeEnabled ? "Change PIN" : "Enable PIN"}
            </Button>
          </HStack>
        </SettingRow>
      </Section>
    </Stack>
  );
}

import { Button, IconButton, Text } from "@var-ui/react";
import { IconVolume, IconVolumeOff } from "@tabler/icons-react";
import { SNOOZE_MINUTES, type SnoozeMinutes } from "./types";
import type { VoiceStatusReason } from "../voice/useAlarmVoiceCommands";
import * as classes from "./AlarmDialog.styles";

interface Props {
  label: string;
  time: string;
  muted: boolean;
  showSnoozeChoices: boolean;
  showRestart?: boolean;
  voiceListening?: boolean;
  voiceUnavailableReason?: VoiceStatusReason | null;
  onToggleMute: () => void;
  onDismiss: () => void;
  onOpenSnooze: () => void;
  onSnooze: (minutes: SnoozeMinutes) => void;
  onRestart?: () => void;
}

function voiceStatusLabel(
  listening: boolean,
  reason: VoiceStatusReason | null | undefined,
): string | null {
  if (listening) return "Listening for dismiss or snooze";
  if (reason === "unsupported" || reason === "denied" || reason === "error") {
    return "Voice unavailable";
  }
  return null;
}

export function AlarmDialog({
  label,
  time,
  muted,
  showSnoozeChoices,
  showRestart,
  voiceListening = false,
  voiceUnavailableReason = null,
  onToggleMute,
  onDismiss,
  onOpenSnooze,
  onSnooze,
  onRestart,
}: Props) {
  const status = voiceStatusLabel(voiceListening, voiceUnavailableReason);

  return (
    <div className={classes.overlay} role="alertdialog" aria-modal="true" aria-label={label}>
      <div className={classes.card}>
        <div className={classes.topRow}>
          <IconButton
            icon={muted ? <IconVolumeOff size={22} /> : <IconVolume size={22} />}
            appearance="ghost"
            size="lg"
            onClick={onToggleMute}
            aria-label={muted ? "Unmute alarm" : "Mute alarm"}
          />
        </div>
        <div className={`${classes.pulse} ${muted ? classes.pulseSilent : ""}`} />
        <div className={classes.label}>{label || "Alarm"}</div>
        <div className={classes.time}>{time}</div>
        {status ? (
          <Text
            size="sm"
            tone="secondary"
            className={classes.voiceStatus}
            data-listening={voiceListening ? "true" : undefined}
          >
            {status}
          </Text>
        ) : null}
        <div className={classes.actions}>
          <Button size="lg" onClick={onDismiss}>
            Dismiss
          </Button>
          {!showSnoozeChoices ? (
            <Button size="lg" appearance="subtle" onClick={onOpenSnooze}>
              Snooze
            </Button>
          ) : (
            <div className={classes.snoozeRow}>
              {SNOOZE_MINUTES.map((m) => (
                <Button key={m} size="lg" appearance="subtle" onClick={() => onSnooze(m)}>
                  {m} min
                </Button>
              ))}
            </div>
          )}
          {showRestart && onRestart && !showSnoozeChoices ? (
            <Button size="lg" appearance="outline" onClick={onRestart}>
              Restart
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

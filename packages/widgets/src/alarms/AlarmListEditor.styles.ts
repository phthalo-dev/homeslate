import { styles } from "../typeStyles";

export const list = styles.class("alarmlisteditor-list", {
  width: "100%",
});

export const card = styles.class("alarmlisteditor-card", {
  width: "100%",
});

export const timeInput = styles.class("alarmlisteditor-timeInput", {
  width: "6.5rem",
});

export const toneSelect = styles.class("alarmlisteditor-toneSelect", {
  width: "8.5rem",
});

export const dayRow = styles.class("alarmlisteditor-dayRow", {
  flexWrap: "wrap",
});

export const dayChip = styles.class("alarmlisteditor-dayChip", {
  flex: "1",
  minWidth: "2.25rem",
  height: "2.25rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid var(--var-ui-color-border-default)",
  background: "var(--var-ui-color-background-surface)",
  color: "var(--var-ui-color-text-secondary)",
  borderRadius: "var(--var-ui-radius-sm)",
  fontSize: "0.8rem",
  fontWeight: "600",
  cursor: "pointer",
  transition: "background 0.12s ease,\n    border-color 0.12s ease,\n    color 0.12s ease",
  "-webkit-tap-highlight-color": "transparent",
  "&:hover": {
    borderColor: "var(--var-ui-color-tone-accent-foreground)",
  },
});

export const dayChipActive = styles.class("alarmlisteditor-dayChipActive", {
  background: "var(--var-ui-color-tone-accent-foreground)",
  borderColor: "var(--var-ui-color-tone-accent-foreground)",
  color: "var(--var-ui-color-tone-accent-foregroundOnBackground)",
});

export const addBtn = styles.class("alarmlisteditor-addBtn", {
  alignSelf: "flex-start",
});

export const addButton = styles.class("alarmlisteditor-addButton", {
  alignSelf: "flex-start",
});

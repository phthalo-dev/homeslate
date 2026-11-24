import { styles } from "../typeStyles";

export const list = styles.class("householdeditor-list", {
  width: "100%",
});

export const row = styles.class("householdeditor-row", {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.5rem",
  // VarUI fields default to a 15rem minimum width; let them shrink so the row fits the dialog.
  "& > *": { minWidth: 0 },
});

export const nameField = styles.class("householdeditor-nameField", {
  flex: "1 1 8rem",
});

/** The member's colour arrives as `--member-color`. */
export const disc = styles.class("householdeditor-disc", {
  background: "var(--member-color)",
  width: "1.75rem",
  height: "1.75rem",
  minWidth: "1.75rem",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.75rem",
  fontWeight: "700",
  color: "var(--var-ui-color-tone-accent-foregroundOnBackground, var(--var-ui-color-text-primary))",
});

export const colorField = styles.class("householdeditor-colorField", {
  flex: "1 1 9rem",
  minWidth: 0,
});

export const swatch = styles.class("householdeditor-swatch", {
  width: "1.5rem",
  height: "1.5rem",
  minWidth: "1.5rem",
  padding: "0",
  border: "1px solid var(--var-ui-color-border-default)",
  borderRadius: "999px",
  cursor: "pointer",
});

export const swatchActive = styles.class("householdeditor-swatchActive", {
  outline: "2px solid var(--var-ui-color-tone-accent-foreground)",
  outlineOffset: "2px",
});

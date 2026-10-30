import { styles } from "../typeStyles";

export const list = styles.class("householdeditor-list", {
  width: "100%",
});

export const row = styles.class("householdeditor-row", {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
});

export const disc = styles.class("householdeditor-disc", {
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
  width: "9rem",
  flexShrink: 0,
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

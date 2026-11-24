import { styles } from "./typeStyles";

export const sectionHeader = styles.class("settings-sectionHeader", {
  padding: "var(--var-ui-space-lg) var(--var-ui-space-lg) var(--var-ui-space-sm)",
});

export const sectionDescription = styles.class("settings-sectionDescription", {
  marginTop: "4px",
});

export const row = styles.class("settings-row", {
  padding: "var(--var-ui-space-md) var(--var-ui-space-lg)",
  borderTop: "1px solid var(--var-ui-color-border-default)",
});

export const rowText = styles.class("settings-rowText", {
  flex: "1 1 12rem",
  minWidth: 0,
});

/** Compact select: VarUI fields default to a 15rem minimum width, so let the field root shrink. */
export const narrowField = styles.class("settings-narrowField", {
  width: "220px",
  maxWidth: "100%",
  "& > *": { minWidth: 0 },
});

export const below = styles.class("settings-below", {
  marginTop: "var(--var-ui-space-sm)",
});

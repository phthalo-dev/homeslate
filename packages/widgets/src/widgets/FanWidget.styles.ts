import { styles } from "../typeStyles";

export const container = styles.class("fanwidget-container", {
  height: "100%",
  background: "var(--var-ui-widget-background, var(--var-ui-color-background-surface))",
  border:
    "var(--var-ui-widget-borderWidth, 1px) solid\n    var(--var-ui-widget-borderColor, var(--var-ui-color-border-default))",
  borderRadius: "var(--var-ui-widget-radius, var(--var-ui-radius-md))",
  padding: "var(--var-ui-widget-padding, var(--var-ui-space-3))",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "var(--var-ui-space-2)",
});

export const transparent = styles.class("fanwidget-transparent", {
  background: "transparent",
  borderColor: "transparent",
});

export const empty = styles.class("fanwidget-empty", {
  flex: "1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--var-ui-space-2)",
  textAlign: "center",
});

export const emptyIcon = styles.class("fanwidget-emptyIcon", {
  color: "var(--var-ui-color-text-secondary)",
});

export const emptyTitle = styles.class("fanwidget-emptyTitle", {
  fontWeight: 600,
});

export const header = styles.class("fanwidget-header", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--var-ui-space-2)",
});

export const title = styles.class("fanwidget-title", {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontWeight: 600,
  minWidth: 0,
});

export const powerRow = styles.class("fanwidget-powerRow", {
  display: "flex",
  alignItems: "center",
  gap: "var(--var-ui-space-3)",
});

export const powerButton = styles.class("fanwidget-powerButton", {
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  border: "1px solid var(--var-ui-color-border-default)",
  background: "var(--var-ui-color-background-muted, transparent)",
  color: "var(--var-ui-color-text-secondary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
});

export const powerButtonOn = styles.class("fanwidget-powerButtonOn", {
  color: "var(--var-ui-color-accent)",
  borderColor: "var(--var-ui-color-accent)",
});

export const state = styles.class("fanwidget-state", {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  minWidth: 0,
});

export const speedRow = styles.class("fanwidget-speedRow", {
  display: "flex",
  alignItems: "center",
  gap: "var(--var-ui-space-2)",
});

export const range = styles.class("fanwidget-range", {
  flex: "1",
  minWidth: "0",
  width: "100%",
});

export const modeRow = styles.class("fanwidget-modeRow", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--var-ui-space-2)",
});

export const errorBox = styles.class("fanwidget-error", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--var-ui-space-2)",
});

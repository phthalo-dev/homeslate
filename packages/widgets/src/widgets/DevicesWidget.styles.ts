import { styles } from "../typeStyles";

export const container = styles.class("deviceswidget-container", {
  height: "100%",
  background: "var(--var-ui-widget-background, var(--var-ui-color-background-surface))",
  border:
    "var(--var-ui-widget-borderWidth, 1px) solid\n    var(--var-ui-widget-borderColor, var(--var-ui-color-border-default))",
  borderRadius: "var(--var-ui-widget-radius, var(--var-ui-radius-md))",
  padding: "var(--var-ui-widget-padding, var(--var-ui-space-3))",
  overflowY: "auto",
});

export const transparent = styles.class("deviceswidget-transparent", {
  background: "transparent",
  borderColor: "transparent",
});

export const empty = styles.class("deviceswidget-empty", {
  flex: "1",
  justifyContent: "center",
  padding: "var(--var-ui-space-3)",
});

export const grid = styles.class("deviceswidget-grid", {
  flex: "1",
  alignContent: "start",
});

export const card = styles.class("deviceswidget-card", {
  padding: "var(--var-ui-space-2)",
  gap: "var(--var-ui-space-2)",
});

export const cardOn = styles.class("deviceswidget-cardOn", {
  borderColor: "var(--var-ui-color-accent)",
});

export const cardPending = styles.class("deviceswidget-cardPending", {
  opacity: 0.65,
});

export const cardUnavailable = styles.class("deviceswidget-cardUnavailable", {
  opacity: 0.5,
});

export const toggleRow = styles.class("deviceswidget-toggleRow", {
  minWidth: 0,
  flex: "1",
  "& .var-ui-switch": {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
  },
  "& .var-ui-switch__track": {
    flexShrink: 0,
  },
  "& .var-ui-switch__label": {
    minWidth: 0,
    overflow: "hidden",
  },
});

export const brightness = styles.class("deviceswidget-brightness", {
  minWidth: "0",
  width: "100%",
});

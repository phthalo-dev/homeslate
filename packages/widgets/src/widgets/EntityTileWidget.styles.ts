import { styles } from "../typeStyles";

export const container = styles.class("entitytilewidget-container", {
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

export const transparent = styles.class("entitytilewidget-transparent", {
  background: "transparent",
  borderColor: "transparent",
});

export const empty = styles.class("entitytilewidget-empty", {
  flex: "1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--var-ui-space-2)",
  textAlign: "center",
});

export const emptyIcon = styles.class("entitytilewidget-emptyIcon", {
  color: "var(--var-ui-color-text-secondary)",
});

export const emptyTitle = styles.class("entitytilewidget-emptyTitle", {
  fontWeight: 600,
});

export const header = styles.class("entitytilewidget-header", {
  display: "flex",
  alignItems: "center",
  gap: "var(--var-ui-space-2)",
});

export const headerIcon = styles.class("entitytilewidget-headerIcon", {
  color: "var(--var-ui-color-text-secondary)",
  display: "flex",
  flexShrink: 0,
});

export const title = styles.class("entitytilewidget-title", {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  flex: "1",
});

export const name = styles.class("entitytilewidget-name", {
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const state = styles.class("entitytilewidget-state", {
  fontSize: "0.8em",
  color: "var(--var-ui-color-text-secondary)",
});

export const controls = styles.class("entitytilewidget-controls", {
  display: "flex",
  flexDirection: "column",
  gap: "var(--var-ui-space-2)",
});

export const actions = styles.class("entitytilewidget-actions", {
  display: "flex",
  gap: "var(--var-ui-space-1)",
  flexWrap: "wrap",
});

export const sliderRow = styles.class("entitytilewidget-sliderRow", {
  display: "flex",
  alignItems: "center",
  gap: "var(--var-ui-space-2)",
});

export const range = styles.class("entitytilewidget-range", {
  flex: "1",
  minWidth: "0",
  width: "100%",
});

export const errorBox = styles.class("entitytilewidget-error", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--var-ui-space-2)",
});

import { styles } from "../typeStyles";

export const container = styles.class("coverswidget-container", {
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

export const transparent = styles.class("coverswidget-transparent", {
  background: "transparent",
  borderColor: "transparent",
});

export const empty = styles.class("coverswidget-empty", {
  flex: "1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--var-ui-space-2)",
  textAlign: "center",
});

export const emptyIcon = styles.class("coverswidget-emptyIcon", {
  color: "var(--var-ui-color-text-secondary)",
});

export const emptyTitle = styles.class("coverswidget-emptyTitle", {
  fontWeight: 600,
});

export const list = styles.class("coverswidget-list", {
  display: "flex",
  flexDirection: "column",
  gap: "var(--var-ui-space-2)",
  flex: "1",
});

export const row = styles.class("coverswidget-row", {
  display: "flex",
  flexDirection: "column",
  gap: "var(--var-ui-space-2)",
  padding: "var(--var-ui-space-2)",
  borderRadius: "var(--var-ui-radius-sm)",
  border: "1px solid var(--var-ui-color-border-default)",
  background: "var(--var-ui-color-background-muted, transparent)",
});

export const rowPending = styles.class("coverswidget-rowPending", {
  opacity: 0.65,
});

export const rowUnavailable = styles.class("coverswidget-rowUnavailable", {
  opacity: 0.5,
});

export const rowTop = styles.class("coverswidget-rowTop", {
  display: "flex",
  alignItems: "center",
  gap: "var(--var-ui-space-2)",
});

export const stateDot = styles.class("coverswidget-stateDot", {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  flexShrink: 0,
});

export const coverDetails = styles.class("coverswidget-coverDetails", {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  flex: "1",
});

export const coverName = styles.class("coverswidget-coverName", {
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const coverState = styles.class("coverswidget-coverState", {
  fontSize: "0.8em",
  color: "var(--var-ui-color-text-secondary)",
});

export const positionLabel = styles.class("coverswidget-positionLabel", {
  fontSize: "0.8em",
  color: "var(--var-ui-color-text-secondary)",
});

export const actions = styles.class("coverswidget-actions", {
  display: "flex",
  gap: "var(--var-ui-space-1)",
  flexWrap: "wrap",
});

export const sliderRow = styles.class("coverswidget-sliderRow", {
  display: "flex",
  alignItems: "center",
  gap: "var(--var-ui-space-2)",
});

export const range = styles.class("coverswidget-range", {
  flex: "1",
  minWidth: "0",
  width: "100%",
});

export const errorBox = styles.class("coverswidget-error", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--var-ui-space-2)",
});

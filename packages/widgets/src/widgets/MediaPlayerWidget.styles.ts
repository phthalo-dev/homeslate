import { styles } from "../typeStyles";

export const container = styles.class("mediaplayerwidget-container", {
  height: "100%",
  background: "var(--var-ui-widget-background, var(--var-ui-color-background-surface))",
  border:
    "var(--var-ui-widget-borderWidth, 1px) solid\n    var(--var-ui-widget-borderColor, var(--var-ui-color-border-default))",
  borderRadius: "var(--var-ui-widget-radius, var(--var-ui-radius-md))",
  padding: "var(--var-ui-widget-padding, var(--var-ui-space-3))",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: "var(--var-ui-space-2)",
});

export const transparent = styles.class("mediaplayerwidget-transparent", {
  background: "transparent",
  borderColor: "transparent",
});

export const empty = styles.class("mediaplayerwidget-empty", {
  flex: "1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--var-ui-space-2)",
  textAlign: "center",
});

export const emptyIcon = styles.class("mediaplayerwidget-emptyIcon", {
  color: "var(--var-ui-color-text-secondary)",
});

export const emptyTitle = styles.class("mediaplayerwidget-emptyTitle", {
  fontWeight: 600,
});

export const header = styles.class("mediaplayerwidget-header", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--var-ui-space-2)",
});

export const heading = styles.class("mediaplayerwidget-heading", {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontWeight: 600,
  minWidth: 0,
});

export const body = styles.class("mediaplayerwidget-body", {
  display: "flex",
  gap: "var(--var-ui-space-3)",
  minHeight: 0,
  flex: "1",
  alignItems: "center",
});

export const artWrap = styles.class("mediaplayerwidget-artWrap", {
  position: "relative",
  width: "72px",
  height: "72px",
  borderRadius: "var(--var-ui-radius-sm)",
  background: "var(--var-ui-color-background-muted, transparent)",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
});

export const artFallback = styles.class("mediaplayerwidget-artFallback", {
  color: "var(--var-ui-color-text-secondary)",
});

export const art = styles.class("mediaplayerwidget-art", {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

export const info = styles.class("mediaplayerwidget-info", {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  minWidth: 0,
  flex: "1",
});

export const title = styles.class("mediaplayerwidget-title", {
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const subtitle = styles.class("mediaplayerwidget-subtitle", {
  fontSize: "0.85em",
  color: "var(--var-ui-color-text-secondary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const progressTrack = styles.class("mediaplayerwidget-progressTrack", {
  height: "4px",
  borderRadius: "999px",
  background: "var(--var-ui-color-border-default)",
  overflow: "hidden",
});

export const progressFill = styles.class("mediaplayerwidget-progressFill", {
  height: "100%",
  background: "var(--var-ui-color-accent)",
  borderRadius: "999px",
});

export const timeRow = styles.class("mediaplayerwidget-timeRow", {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.7em",
  color: "var(--var-ui-color-text-secondary)",
});

export const controls = styles.class("mediaplayerwidget-controls", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--var-ui-space-1)",
});

export const volumeRow = styles.class("mediaplayerwidget-volumeRow", {
  display: "flex",
  alignItems: "center",
  gap: "var(--var-ui-space-2)",
});

export const range = styles.class("mediaplayerwidget-range", {
  flex: "1",
  minWidth: "0",
  width: "100%",
});

export const errorBox = styles.class("mediaplayerwidget-error", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--var-ui-space-2)",
});

import { styles } from "./typeStyles";

export const panel = styles.class("widgetpanel-panel", {
  width: "280px",
  minWidth: "280px",
  background: "var(--var-ui-color-background-app)",
  borderRight: "1px solid var(--var-ui-color-border-default)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  transition: "width 0.2s ease,\n    min-width 0.2s ease",
  flexShrink: "0",
});

export const toggleBar = styles.class("widgetpanel-toggleBar", {
  display: "flex",
  justifyContent: "flex-end",
  padding: "8px 6px 4px",
  borderBottom: "1px solid var(--var-ui-color-border-default)",
});

export const toggleBtn = styles.class("widgetpanel-toggleBtn", {
  color: "var(--var-ui-color-text-secondary)",
});

export const content = styles.class("widgetpanel-content", {
  padding: "16px 12px",
  overflowY: "auto",
  flex: "1",
});

export const panelTitle = styles.class("widgetpanel-panelTitle", {
  letterSpacing: "0.08em",
  marginBottom: "16px",
  padding: "0 4px",
  color: "var(--var-ui-color-text-secondary)",
});

export const widgetRow = styles.class("widgetpanel-widgetRow", {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "12px",
  padding: "8px 6px",
  borderRadius: "8px",
  width: "100%",
  height: "auto",
  minHeight: "0",
  overflow: "visible",
  textAlign: "left",
  whiteSpace: "normal",
  transition: "background 0.1s ease",
  color: "var(--var-ui-color-text-primary)",
  "&:hover": {
    background: "var(--var-ui-color-overlay-hover)",
  },
});

export const widgetIcon = styles.class("widgetpanel-widgetIcon", {
  width: "40px",
  height: "40px",
  borderRadius: "8px",
  background: "color-mix(in srgb, var(--var-ui-color-text-primary) 14%, transparent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--var-ui-color-text-primary)",
  flexShrink: "0",
});

export const widgetCopy = styles.class("widgetpanel-widgetCopy", {
  flex: "1",
  minWidth: "0",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  textAlign: "left",
});

export const iconOnly = styles.class("widgetpanel-iconOnly", {
  width: "36px",
  height: "36px",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--var-ui-color-text-secondary)",
  transition: "background 0.1s ease,\n    color 0.1s ease",
  "&:hover": {
    background: "var(--var-ui-color-overlay-hover)",
    color: "var(--var-ui-color-tone-accent-foreground)",
  },
});

export const collapsed = styles.class("widgetpanel-collapsed", {
  width: "48px",
  minWidth: "48px",
  [`& .${toggleBar}`]: {
    justifyContent: "center",
  },
});

export const filter = styles.class("widgetpanel-filter", {
  marginBottom: "12px",
});

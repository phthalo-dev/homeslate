import { styles } from "./typeStyles";

/** Responsive grid of view cards. */
export const grid = styles.class("viewspanel-grid", {
  display: "grid",
  gap: "var(--var-ui-space-md)",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 22rem), 1fr))",
  alignItems: "start",
});

/** 16:9 miniature of a view's widget layout. */
export const thumbnail = styles.class("viewspanel-thumbnail", {
  position: "relative",
  aspectRatio: "16 / 9",
  borderRadius: "var(--var-ui-radius-md)",
  background: "var(--var-ui-color-background-app)",
  border: "1px solid var(--var-ui-color-border-default)",
  overflow: "hidden",
});

export const thumbnailHidden = styles.class("viewspanel-thumbnailHidden", {
  opacity: 0.45,
});

export const thumbnailEmpty = styles.class("viewspanel-thumbnailEmpty", {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
});

/** Position comes from `--tile-*` variables set per widget (its grid cell), so the class stays static. */
export const tile = styles.class("viewspanel-tile", {
  position: "absolute",
  left: "var(--tile-left)",
  top: "var(--tile-top)",
  width: "var(--tile-width)",
  height: "var(--tile-height)",
  borderRadius: "4px",
  background: "var(--var-ui-color-overlay-hover)",
  border: "1px solid var(--var-ui-color-border-default)",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  padding: "0 4px",
});

export const tileLabel = styles.class("viewspanel-tileLabel", {
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const editButton = styles.class("viewspanel-editButton", {
  flex: "1 1 8rem",
  maxWidth: "11rem",
});

export const iconActions = styles.class("viewspanel-iconActions", {
  marginInlineStart: "auto",
});

export const divider = styles.class("viewspanel-divider", {
  width: "1px",
  height: "16px",
  margin: "0 4px",
  background: "var(--var-ui-color-border-default)",
});

export const dimmedIcon = styles.class("viewspanel-dimmedIcon", {
  opacity: 0.5,
});

import { styles } from "./typeStyles";

/** The 960px content column used by the display list and the manage page. */
export const pageColumn = styles.class("pages-pageColumn", {
  maxWidth: "960px",
  width: "100%",
  marginInline: "auto",
});

export const editorFill = styles.class("pages-editorFill", {
  height: "100%",
  display: "flex",
});

export const kioskCenter = styles.class("pages-kioskCenter", {
  minHeight: "100vh",
  padding: "1rem",
});

export const kioskSaveError = styles.class("pages-kioskSaveError", {
  position: "fixed",
  insetInline: 0,
  top: 0,
  zIndex: 1000,
  textAlign: "center",
  background: "rgba(0, 0, 0, 0.75)",
});

/** Centered spinner shown under the app bars while a display loads. */
export const pending = styles.class("pages-pending", {
  display: "grid",
  placeItems: "center",
  minHeight: "40vh",
});

/** Stands in for a breadcrumb label until the display name arrives. */
export const crumbSkeleton = styles.class("pages-crumbSkeleton", {
  display: "block",
  width: "96px",
  height: "14px",
});

/** Management layout: a left nav the width of the editor's widget palette, then the content. */
export const manage = styles.class("pages-manage", {
  display: "flex",
  alignItems: "stretch",
  // Fill the shell's main area so the nav and the content can each scroll on their own.
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
});

export const manageNav = styles.class("pages-manageNav", {
  flex: "0 0 280px",
  width: "280px",
  background: "var(--var-ui-color-background-app)",
  borderInlineEnd: "1px solid var(--var-ui-color-border-default)",
  overflowY: "auto",
});

export const manageContent = styles.class("pages-manageContent", {
  flex: "1 1 auto",
  minWidth: 0,
  overflowY: "auto",
  padding: "var(--var-ui-space-md)",
});

/** The sections switcher that stands in for the left nav on narrow screens. */
export const switcher = styles.class("pages-switcher", {
  marginBottom: "var(--var-ui-space-md)",
});

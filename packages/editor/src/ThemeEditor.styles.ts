import { styles } from "./typeStyles";

export const page = styles.class("themeeditor-page", {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  height: "100%",
  minHeight: "0",
});

export const mainLayout = styles.class("themeeditor-mainLayout", {
  display: "flex",
  flexWrap: "nowrap",
  gap: "1rem",
  alignItems: "stretch",
  flex: "1",
  minHeight: "0",
  overflow: "hidden",
  "@media (max-width: 900px)": {
    flexDirection: "column",
    overflow: "visible",
  },
});

export const library = styles.class("themeeditor-library", {
  flex: "0 0 240px",
  minWidth: "0",
  display: "flex",
  flexDirection: "column",
  maxHeight: "none",
  "@media (min-width: 960px)": {
    maxWidth: "240px",
  },
  "@media (max-width: 900px)": {
    flexBasis: "auto",
  },
});

export const workspace = styles.class("themeeditor-workspace", {
  flex: "1 1 auto",
  minWidth: "0",
  minHeight: "0",
  display: "flex",
  flexDirection: "column",
  "@media (min-width: 960px)": {
    minHeight: "0",
  },
  "@media (max-width: 900px)": {
    minHeight: "320px",
  },
});

export const libraryScroll = styles.class("themeeditor-libraryScroll", {
  flex: "1",
  minHeight: "64px",
  maxHeight: "360px",
  "@media (min-width: 960px)": {
    maxHeight: "none",
    flex: "0 1 auto",
    minHeight: "64px",
  },
});

export const themeRow = styles.class("themeeditor-themeRow", {
  width: "100%",
  textAlign: "left",
  padding: "0.65rem 0.75rem",
  borderRadius: "var(--var-ui-radius-sm)",
  border: "1px solid var(--var-ui-color-border-default)",
  background: "var(--var-ui-color-background-app)",
  cursor: "pointer",
  transition: "background-color 0.12s ease,\n    border-color 0.12s ease",
  "&:hover": {
    background: "var(--var-ui-color-overlay-hover)",
  },
});

export const themeRowSelected = styles.class("themeeditor-themeRowSelected", {
  borderColor: "var(--var-ui-color-tone-accent-foreground)",
  background: "var(--var-ui-color-tone-accent-subtleBackground)",
});

export const themeRowActive = styles.class("themeeditor-themeRowActive", {
  borderColor: "var(--var-ui-color-tone-success-foreground)",
});

export const themeRowHeader = styles.class("themeeditor-themeRowHeader", {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "0.5rem",
});

export const themeRowMeta = styles.class("themeeditor-themeRowMeta", {
  fontSize: "var(--var-ui-fontSize-xs)",
  color: "var(--var-ui-color-text-secondary)",
  marginTop: "0.2rem",
});

export const themeRowActions = styles.class("themeeditor-themeRowActions", {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.25rem",
  marginTop: "0.5rem",
});

export const workspaceHeader = styles.class("themeeditor-workspaceHeader", {
  flexShrink: "0",
});

export const workspaceBody = styles.class("themeeditor-workspaceBody", {
  flex: "1",
  minHeight: "0",
  display: "flex",
  flexDirection: "column",
});

export const workspaceEmpty = styles.class("themeeditor-workspaceEmpty", {
  flex: "1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  borderRadius: "var(--var-ui-radius-md)",
  border: "1px dashed var(--var-ui-color-border-default)",
  background: "var(--var-ui-color-background-surface)",
});

export const editorPreviewRow = styles.class("themeeditor-editorPreviewRow", {
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateAreas: '"editor"\n    "preview"',
  gap: "1rem",
  alignItems: "start",
  flex: "1",
  minHeight: "0",
  overflow: "hidden",
  "@media (min-width: 1120px)": {
    gridTemplateColumns: "minmax(320px, 0.72fr) minmax(520px, 1.28fr)",
    gridTemplateAreas: '"editor preview"',
  },
  "@media (max-width: 900px)": {
    overflow: "visible",
  },
});

export const editorColumn = styles.class("themeeditor-editorColumn", {
  gridArea: "editor",
  minWidth: "0",
  maxHeight: "100%",
  overflowY: "auto",
  paddingRight: "0.15rem",
  "@media (max-width: 900px)": {
    maxHeight: "none",
    overflow: "visible",
  },
});

export const previewColumn = styles.class("themeeditor-previewColumn", {
  gridArea: "preview",
  minWidth: "0",
  maxHeight: "100%",
  "@media (min-width: 1120px)": {
    position: "sticky",
    top: "1rem",
  },
  "@media (max-width: 900px)": {
    maxHeight: "none",
    overflow: "visible",
  },
});

export const textarea = styles.class("themeeditor-textarea", {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  minHeight: "380px",
});

export const editorTabsList = styles.class("themeeditor-editorTabsList", {
  "& [role=tablist]": {
    position: "sticky",
    top: "0",
    zIndex: "1",
    background: "var(--var-ui-color-background-surface)",
    paddingTop: "0.15rem",
  },
});

export const colorTokenGrid = styles.class("themeeditor-colorTokenGrid", {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "0.75rem",
});

export const widgetTokenIntro = styles.class("themeeditor-widgetTokenIntro", {
  display: "flex",
  justifyContent: "flex-end",
});

export const widgetTokenSearch = styles.class("themeeditor-widgetTokenSearch", {
  minWidth: "0",
  width: "min(100%, 28rem)",
});

export const tokenSection = styles.class("themeeditor-tokenSection", {
  display: "flex",
  flexDirection: "column",
  gap: "0.65rem",
  paddingTop: "0.75rem",
  borderTop: "1px solid var(--var-ui-color-border-default)",
  "&:first-child": {
    paddingTop: "0",
    borderTop: "0",
  },
});

export const colorTokenCard = styles.class("themeeditor-colorTokenCard", {
  background: "var(--var-ui-color-background-app)",
});

export const tokenLabel = styles.class("themeeditor-tokenLabel", {
  minWidth: "0",
});

export const tokenCssVar = styles.class("themeeditor-tokenCssVar", {
  marginTop: "0.2rem",
});

export const colorValueRow = styles.class("themeeditor-colorValueRow", {
  alignItems: "flex-end",
});

export const colorValueInput = styles.class("themeeditor-colorValueInput", {
  flex: "1 1 auto",
  minWidth: "0",
});

export const colorPreviewChip = styles.class("themeeditor-colorPreviewChip", {
  width: "1rem",
  height: "1rem",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--var-ui-color-text-primary) 20%, transparent)",
});

export const colorSourceActions = styles.class("themeeditor-colorSourceActions", {
  flex: "0 0 auto",
  paddingBottom: "0.05rem",
});

export const paletteBrowserGrid = styles.class("themeeditor-paletteBrowserGrid", {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  maxHeight: "min(62vh, 34rem)",
  overflowY: "auto",
  paddingRight: "0.25rem",
});

export const paletteFamilyRow = styles.class("themeeditor-paletteFamilyRow", {
  display: "grid",
  gridTemplateColumns: "minmax(7.5rem, 0.24fr) minmax(0, 1fr)",
  gap: "0.75rem",
  alignItems: "center",
  padding: "0.65rem",
  border: "1px solid var(--var-ui-color-border-default)",
  borderRadius: "var(--var-ui-radius-md)",
  background: "var(--var-ui-color-background-app)",
  "@media (max-width: 760px)": {
    gridTemplateColumns: "1fr",
  },
});

export const paletteFamilyLabel = styles.class("themeeditor-paletteFamilyLabel", {
  minWidth: "0",
});

export const paletteShadeGrid = styles.class("themeeditor-paletteShadeGrid", {
  display: "grid",
  gridTemplateColumns: "repeat(11, minmax(2.6rem, 1fr))",
  gap: "0.35rem",
  minWidth: "0",
  "@media (max-width: 760px)": {
    gridTemplateColumns: "repeat(auto-fit, minmax(2.8rem, 1fr))",
  },
});

export const paletteShadeButton = styles.class("themeeditor-paletteShadeButton", {
  appearance: "none",
  border: "0",
  background: "transparent",
  color: "var(--var-ui-color-text-primary)",
  cursor: "pointer",
  display: "flex",
  minWidth: "0",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.25rem",
  padding: "0.2rem",
  borderRadius: "var(--var-ui-radius-sm)",
  "&:hover": {
    background: "var(--var-ui-color-overlay-hover)",
    outline: "none",
  },
  "&:focus-visible": {
    background: "var(--var-ui-color-overlay-hover)",
    outline: "none",
  },
});

export const paletteShadeChip = styles.class("themeeditor-paletteShadeChip", {
  width: "100%",
  minWidth: "1.75rem",
  height: "1.65rem",
  borderRadius: "var(--var-ui-radius-sm)",
  border: "1px solid color-mix(in srgb, var(--var-ui-color-text-primary) 16%, transparent)",
});

export const paletteShadeLabel = styles.class("themeeditor-paletteShadeLabel", {
  fontSize: "0.625rem",
  color: "var(--var-ui-color-text-secondary)",
});

export const previewViewSelect = styles.class("themeeditor-previewViewSelect", {
  width: "min(15rem, 42vw)",
});

export const previewShell = styles.class("themeeditor-previewShell", {
  borderRadius: "var(--var-ui-radius-md)",
  border: "1px solid var(--var-ui-color-border-default)",
  minHeight: "min(560px, calc(100dvh - 180px))",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const previewCanvas = styles.class("themeeditor-previewCanvas", {
  flex: "1",
  minHeight: "min(520px, calc(100dvh - 220px))",
  padding: "0.75rem",
  backgroundColor: "var(--var-ui-color-background-app)",
  fontFamily: "var(--var-ui-fontFamily-body)",
});

export const actualPreviewViewport = styles.class("themeeditor-actualPreviewViewport", {
  position: "relative",
  width: "100%",
  height: "clamp(520px, calc(100dvh - 220px), 820px)",
  overflow: "hidden",
  borderRadius: "12px",
  backgroundColor: "transparent",
  border: "1px solid var(--var-ui-color-border-default)",
});

export const previewToolbar = styles.class("themeeditor-previewToolbar", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.5rem 0.75rem",
  marginBottom: "0.75rem",
  borderRadius: "8px",
  background: "var(--var-ui-color-background-surface)",
  border: "1px solid var(--var-ui-color-border-default)",
  color: "var(--var-ui-color-text-primary)",
  fontSize: "0.75rem",
  fontWeight: "600",
});

export const previewWidget = styles.class("themeeditor-previewWidget", {
  borderRadius: "12px",
  padding: "1rem",
  background: "var(--var-ui-color-background-surface)",
  border: "1px solid var(--var-ui-color-border-default)",
  boxShadow: "0 0 16px var(--var-ui-color-ring-default)",
});

export const previewWidgetTitle = styles.class("themeeditor-previewWidgetTitle", {
  color: "var(--var-ui-color-text-primary)",
  fontSize: "1rem",
  fontWeight: "600",
  margin: "0 0 0.25rem",
});

export const previewWidgetMuted = styles.class("themeeditor-previewWidgetMuted", {
  color: "var(--var-ui-color-text-secondary)",
  fontSize: "0.8rem",
  margin: "0 0 1rem",
});

export const previewButton = styles.class("themeeditor-previewButton", {
  display: "inline-block",
  padding: "0.35rem 0.85rem",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: "500",
  border: "1px solid var(--var-ui-color-tone-accent-foreground)",
  background: "var(--var-ui-color-tone-accent-foreground)",
  color: "var(--var-ui-color-tone-accent-foregroundOnBackground)",
  cursor: "default",
});

export const previewPlaceholder = styles.class("themeeditor-previewPlaceholder", {
  flex: "1",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "240px",
  color: "var(--var-ui-color-text-secondary)",
  fontSize: "var(--var-ui-fontSize-sm)",
  textAlign: "center",
  padding: "1rem",
});

export const formField = styles.class("themeeditor-formField", {
  width: "100%",
  minWidth: 0,
});

/** Preset gallery on the empty Theme section. */
export const presetGrid = styles.class("themeeditor-presetGrid", {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(8.5rem, 1fr))",
  gap: "0.75rem",
  width: "100%",
  maxWidth: "560px",
});

export const presetCard = styles.class("themeeditor-presetCard", {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "0.5rem",
  height: "auto",
  padding: "0.6rem",
  border: "1px solid var(--var-ui-color-border-default)",
  borderRadius: "var(--var-ui-radius-md)",
  textAlign: "start",
});

export const swatchRow = styles.class("themeeditor-swatchRow", {
  display: "flex",
  height: "28px",
  borderRadius: "var(--var-ui-radius-sm)",
  overflow: "hidden",
});

/** Each swatch's color arrives as `--swatch`. */
export const swatch = styles.class("themeeditor-swatch", {
  flex: 1,
  background: "var(--swatch)",
});

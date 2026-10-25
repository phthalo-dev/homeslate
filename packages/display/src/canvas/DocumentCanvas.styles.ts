import { keyframes } from "typestyles";
import { global, styles } from "../typeStyles";

const viewFadeIn = keyframes.create("viewFadeIn", {
  from: { opacity: 0, transform: "scale(0.985)" },
  to: { opacity: 1, transform: "scale(1)" },
});

export const container = styles.class("documentcanvas-container", {
  flex: "1",
  minHeight: "0",
  overflow: "hidden",
  padding: "1rem",
  paddingBottom: "3rem",
  display: "flex",
  flexDirection: "column",
  position: "relative",
});

export const gridWrapper = styles.class("documentcanvas-gridWrapper", {
  position: "relative",
  flexShrink: "0",
});

export const notesOverlay = styles.class("documentcanvas-notesOverlay", {
  position: "absolute",
  inset: "0",
  pointerEvents: "none",
  zIndex: "40",
  overflow: "hidden",
});

export const addNoteBtn = styles.class("documentcanvas-addNoteBtn", {
  position: "absolute",
  bottom: "14px",
  right: "14px",
  zIndex: "100",
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  border: "none",
  background: "color-mix(in srgb, var(--var-ui-color-tone-accent-foreground) 85%, transparent)",
  color: "#fff",
  fontSize: "22px",
  lineHeight: "1",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  transition: "background 0.15s ease,\n    transform 0.15s ease",
  pointerEvents: "auto",
  "&:hover": {
    background: "var(--var-ui-color-tone-accent-foreground)",
    transform: "scale(1.1)",
  },
});

export const grid = styles.class("documentcanvas-grid", {
  position: "relative",
  height: "100%",
});

export const widgetContainer = styles.class("documentcanvas-widgetContainer", {
  height: "100%",
  overflow: "hidden",
});

export const empty = styles.class("documentcanvas-empty", {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  minHeight: "400px",
  color: "var(--var-ui-color-text-secondary)",
  textAlign: "center",
  "& h2": {
    fontSize: "1.5rem",
    fontWeight: "500",
    marginBottom: "0.5rem",
    background:
      "linear-gradient(\n    135deg,\n    var(--var-ui-color-tone-accent-foreground) 0%,\n    var(--var-ui-color-tone-accent-foreground) 100%\n  )",
    "-webkit-background-clip": "text",
    "-webkit-text-fill-color": "transparent",
    backgroundClip: "text",
  },
  "& p": {
    fontSize: "1rem",
    opacity: "0.7",
  },
});

export const editing = styles.class("documentcanvas-editing", {});

export const fadeIn = styles.class("documentcanvas-fadeIn", {
  animation: `${viewFadeIn} 0.35s ease`,
});

global.rule(".react-grid-item.react-grid-placeholder", {
  background:
    "color-mix(in srgb, var(--var-ui-color-tone-accent-foreground) 20%, transparent) !important",
  border:
    "2px dashed color-mix(in srgb, var(--var-ui-color-tone-accent-foreground) 50%, transparent) !important",
  borderRadius: "var(--var-ui-radius-md)",
});
global.rule(".react-grid-item.resizing", {
  zIndex: 100,
  opacity: 0.9,
});
global.rule(".react-resizable-handle", {
  backgroundImage: "none !important",
  opacity: 0,
  transition: "opacity 0.2s ease",
});
global.rule(".react-grid-item:hover .react-resizable-handle", {
  opacity: 1,
});
global.rule(
  ".react-resizable-handle-se, .react-resizable-handle-sw, .react-resizable-handle-ne, .react-resizable-handle-nw",
  { width: "20px !important", height: "20px !important" },
);
global.rule(".react-resizable-handle-se", { bottom: 0, right: 0, cursor: "se-resize" });
global.rule(".react-resizable-handle-sw", { bottom: 0, left: 0, cursor: "sw-resize" });
global.rule(".react-resizable-handle-ne", { top: 0, right: 0, cursor: "ne-resize" });
global.rule(".react-resizable-handle-nw", { top: 0, left: 0, cursor: "nw-resize" });
global.rule(".react-resizable-handle-e, .react-resizable-handle-w", {
  width: "10px !important",
  height: "50% !important",
  top: "25% !important",
  cursor: "ew-resize",
});
global.rule(".react-resizable-handle-e", { right: 0 });
global.rule(".react-resizable-handle-w", { left: 0 });
global.rule(".react-resizable-handle-n, .react-resizable-handle-s", {
  height: "10px !important",
  width: "50% !important",
  left: "25% !important",
  cursor: "ns-resize",
});
global.rule(".react-resizable-handle-n", { top: 0 });
global.rule(".react-resizable-handle-s", { bottom: 0 });
global.rule(
  ".react-resizable-handle-se::after, .react-resizable-handle-sw::after, .react-resizable-handle-ne::after, .react-resizable-handle-nw::after",
  {
    content: '""',
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
    background: "color-mix(in srgb, var(--var-ui-color-tone-accent-foreground) 60%, transparent)",
    transition: "all 0.2s ease",
  },
);
global.rule(".react-resizable-handle-se::after", { right: 4, bottom: 4 });
global.rule(".react-resizable-handle-sw::after", { left: 4, bottom: 4 });
global.rule(".react-resizable-handle-ne::after", { right: 4, top: 4 });
global.rule(".react-resizable-handle-nw::after", { left: 4, top: 4 });
global.rule(".react-resizable-handle-e::after, .react-resizable-handle-w::after", {
  content: '""',
  position: "absolute",
  width: 4,
  height: 30,
  top: "50%",
  transform: "translateY(-50%)",
  borderRadius: 2,
  background: "color-mix(in srgb, var(--var-ui-color-tone-accent-foreground) 60%, transparent)",
  transition: "all 0.2s ease",
});
global.rule(".react-resizable-handle-e::after", { right: 2 });
global.rule(".react-resizable-handle-w::after", { left: 2 });
global.rule(".react-resizable-handle-n::after, .react-resizable-handle-s::after", {
  content: '""',
  position: "absolute",
  height: 4,
  width: 30,
  left: "50%",
  transform: "translateX(-50%)",
  borderRadius: 2,
  background: "color-mix(in srgb, var(--var-ui-color-tone-accent-foreground) 60%, transparent)",
  transition: "all 0.2s ease",
});
global.rule(".react-resizable-handle-n::after", { top: 2 });
global.rule(".react-resizable-handle-s::after", { bottom: 2 });
global.rule(".react-resizable-handle:hover::after", {
  background: "var(--var-ui-color-tone-accent-foreground)",
  transform: "scale(1.2)",
});
global.rule(".react-resizable-handle-e:hover::after, .react-resizable-handle-w:hover::after", {
  transform: "translateY(-50%) scale(1.2)",
});
global.rule(".react-resizable-handle-n:hover::after, .react-resizable-handle-s:hover::after", {
  transform: "translateX(-50%) scale(1.2)",
});

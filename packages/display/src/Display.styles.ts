import { styles } from "./typeStyles";

export const dots = styles.class("display-dots", {
  position: "absolute",
  bottom: "16px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "8px",
  zIndex: "10",
});

export const navPrev = styles.class("display-navPrev", {
  position: "absolute",
  top: "0",
  bottom: "0",
  width: "10%",
  minWidth: "48px",
  background: "transparent",
  border: "none",
  padding: "0",
  margin: "0",
  cursor: "pointer",
  zIndex: "10",
  "-webkit-tap-highlight-color": "transparent",
  left: "0",
});

export const navNext = styles.class("display-navNext", {
  position: "absolute",
  top: "0",
  bottom: "0",
  width: "10%",
  minWidth: "48px",
  background: "transparent",
  border: "none",
  padding: "0",
  margin: "0",
  cursor: "pointer",
  zIndex: "10",
  "-webkit-tap-highlight-color": "transparent",
  right: "0",
});

export const iconIndicator = styles.class("display-iconIndicator", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "var(--var-ui-color-background-surface, rgba(0, 0, 0, 0.35))",
  border: "1px solid var(--var-ui-color-border-default, rgba(255, 255, 255, 0.15))",
  color: "var(--var-ui-color-text-secondary, rgba(255, 255, 255, 0.5))",
  cursor: "pointer",
  padding: "0",
  backdropFilter: "blur(8px)",
  "-webkit-backdrop-filter": "blur(8px)",
  transition:
    "background 0.2s ease,\n    color 0.2s ease,\n    border-color 0.2s ease,\n    transform 0.15s ease",
  "-webkit-tap-highlight-color": "transparent",
  "&:hover": {
    background: "var(--var-ui-color-background-surface, rgba(0, 0, 0, 0.55))",
    color: "var(--var-ui-color-text-primary, white)",
  },
});

export const iconIndicatorActive = styles.class("display-iconIndicatorActive", {
  background: "var(--var-ui-color-background-surface, rgba(0, 0, 0, 0.6))",
  borderColor: "var(--var-ui-color-text-primary, rgba(255, 255, 255, 0.7))",
  color: "var(--var-ui-color-text-primary, white)",
  transform: "scale(1.1)",
});

export const iconIndicatorWithProgress = styles.class("display-iconIndicatorWithProgress", {
  position: "relative",
});

export const progressRing = styles.class("display-progressRing", {
  position: "absolute",
  width: "100%",
  height: "100%",
  pointerEvents: "none",
});

export const progressRingBg = styles.class("display-progressRingBg", {
  stroke: "var(--var-ui-color-border-default, rgba(255, 255, 255, 0.15))",
});

export const progressRingFill = styles.class("display-progressRingFill", {
  stroke: "var(--var-ui-color-text-primary, white)",
  strokeDasharray: "var(--circumference)",
  strokeDashoffset: "var(--circumference)",
  animation: "progressFill var(--rotation-duration, 30000ms) linear forwards",
});

export const iconPlaceholder = styles.class("display-iconPlaceholder", {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "currentColor",
  opacity: "0.5",
});

export const colorModeToggle = styles.class("display-colorModeToggle", {
  position: "absolute",
  top: "12px",
  right: "12px",
  zIndex: "20",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  opacity: "0",
  transition: "opacity 0.2s ease",
  "&:focus-within": {
    opacity: "1",
  },
});

export const colorModeBtn = styles.class("display-colorModeBtn", {
  color: "var(--var-ui-color-text-primary, white)",
  background: "var(--var-ui-color-background-surface, rgba(0, 0, 0, 0.4))",
  border: "1px solid var(--var-ui-color-border-default, rgba(255, 255, 255, 0.15))",
  borderRadius: "50%",
  backdropFilter: "blur(8px)",
  "-webkit-backdrop-filter": "blur(8px)",
});

export const root = styles.class("display-root", {
  width: "100vw",
  height: "100dvh",
  backgroundColor: "var(--var-ui-color-background-app)",
  overflow: "hidden",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  touchAction: "pan-y",
  [`&:hover .${colorModeToggle}`]: {
    opacity: "1",
  },
  [`&:focus-within .${colorModeToggle}`]: {
    opacity: "1",
  },
});

import { styles } from "./typeStyles";

export const banner = styles.class("offlinebanner-banner", {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1100,
  padding: "0.35rem 0.75rem",
  textAlign: "center",
  fontSize: "0.85rem",
  background: "rgba(0, 0, 0, 0.78)",
  color: "white",
  pointerEvents: "none",
});

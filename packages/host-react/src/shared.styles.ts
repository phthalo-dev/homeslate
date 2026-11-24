import { styles } from "./typeStyles";

/** Fixed-size slot so titles line up whether or not an icon is present. */
export const iconSlot = styles.class("host-iconSlot", {
  width: "18px",
  height: "18px",
  flexShrink: 0,
  display: "inline-flex",
});

/** Lets a flex child shrink below its content width so long text can truncate or wrap. */
export const shrinkable = styles.class("host-shrinkable", {
  minWidth: 0,
});

export const nowrap = styles.class("host-nowrap", {
  whiteSpace: "nowrap",
});

/** Padding around standalone error text. */
export const alertPad = styles.class("host-alertPad", {
  padding: "1rem",
});

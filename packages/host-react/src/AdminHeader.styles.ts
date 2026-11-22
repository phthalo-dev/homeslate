import { styles } from "./typeStyles";

/** Hairline under the primary bar. */
export const topNav = styles.class("adminheader-topNav", {
  borderBottom: "1px solid var(--var-ui-color-border-default)",
});

/** Placeholder logo: the product's first letter in a circle. */
export const logo = styles.class("adminheader-logo", {
  display: "inline-grid",
  placeItems: "center",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "var(--var-ui-color-tone-accent-background)",
  color: "var(--var-ui-color-tone-accent-foregroundOnBackground, #fff)",
  fontWeight: 700,
  fontSize: "14px",
  lineHeight: 1,
});

export const visuallyHidden = styles.class("adminheader-visuallyHidden", {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
});

/** Secondary bar: the trail for the current display plus display-level actions. */
export const subbar = styles.class("adminheader-subbar", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  columnGap: "var(--var-ui-space-md)",
  rowGap: "var(--var-ui-space-xs)",
  minHeight: "48px",
  padding: "var(--var-ui-space-xs) var(--var-ui-space-md)",
  borderBottom: "1px solid var(--var-ui-color-border-default)",
  background: "var(--var-ui-color-background-surface)",
  "& .var-ui-breadcrumbs, & .var-ui-breadcrumbs__list": {
    minWidth: 0,
    flexWrap: "nowrap",
  },
  "& .var-ui-breadcrumbs__item": {
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  "& .var-ui-breadcrumbs__item[data-current]": {
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  "& .var-ui-breadcrumbs__link": {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "24px",
    fontSize: "var(--var-ui-fontSize-md)",
  },
});

export const subbarEnd = styles.class("adminheader-subbarEnd", {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "var(--var-ui-space-md)",
  marginInlineStart: "auto",
});

/** Where the view editor mounts its toolbar; collapses when nothing is mounted. */
export const subbarTools = styles.class("adminheader-subbarTools", {
  display: "flex",
  alignItems: "center",
  gap: "var(--var-ui-space-sm)",
  "&:empty": { display: "none" },
});

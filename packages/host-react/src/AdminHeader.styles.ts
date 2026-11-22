import { styles } from "./typeStyles";

/** Hairline under the app bar, a divider between the logo and the trail, and a one-row trail. */
export const topNav = styles.class("adminheader-topNav", {
  borderBottom: "1px solid var(--var-ui-color-border-default)",
  "& .var-ui-top-nav__start": {
    minWidth: 0,
    marginInlineStart: "var(--var-ui-space-sm)",
    paddingInlineStart: "var(--var-ui-space-md)",
    borderInlineStart: "1px solid var(--var-ui-color-border-default)",
  },
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
  // Phones: only the current page stays in the trail; the logo links home.
  "@media (max-width: 47.99rem)": {
    gap: "var(--var-ui-space-xs)",
    "& .var-ui-top-nav__start": {
      marginInlineStart: 0,
      paddingInlineStart: 0,
      borderInlineStart: 0,
    },
    "& .var-ui-breadcrumbs__item:not([data-current])": { display: "none" },
  },
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

/** Where the view editor mounts its toolbar; collapses when nothing is mounted. */
export const tools = styles.class("adminheader-tools", {
  display: "flex",
  alignItems: "center",
  gap: "var(--var-ui-space-xs)",
  "&:empty": { display: "none" },
});

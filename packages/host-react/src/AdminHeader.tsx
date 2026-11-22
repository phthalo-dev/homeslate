import type { ReactNode } from "react";
import { Breadcrumbs, HStack, TopNav } from "@var-ui/react";
import { useHomeslateHost } from "./hostContext";
import * as classes from "./AdminHeader.styles";

export type AdminCrumb = {
  id: string;
  label: ReactNode;
  /** Omit on the current page. */
  href?: string;
};

/** Placeholder logo: an "H" in a circle. Swap for the real mark when there is one. */
function LogoMark(props: { productName: string }) {
  return (
    <>
      <span className={classes.logo} aria-hidden="true">
        {props.productName.trim().charAt(0).toUpperCase() || "H"}
      </span>
      <span className={classes.visuallyHidden}>{props.productName}</span>
    </>
  );
}

/**
 * The one app bar every admin page shares, full width and a single row: the logo (links home), the
 * breadcrumb trail for where you are, then page tools and actions on the right. On phones the trail
 * collapses to the current page (the logo is the way home) so the bar never wraps.
 */
export function AppBar(props: {
  crumbs: AdminCrumb[];
  actions?: ReactNode;
  /** Receives the element that hosts page tools (for example the view editor's toolbar). */
  toolsRef?: (element: HTMLElement | null) => void;
}) {
  const { crumbs, actions, toolsRef } = props;
  const { productName } = useHomeslateHost();
  return (
    <TopNav
      label="Primary"
      className={classes.topNav}
      heading={<TopNav.Heading heading={<LogoMark productName={productName} />} headingHref="/" />}
      startContent={<Breadcrumbs label="You are here" separator="/" items={crumbs} />}
      endContent={
        toolsRef || actions ? (
          <HStack gap="xs" align="center" wrap={false}>
            {toolsRef ? <div ref={toolsRef} className={classes.tools} /> : null}
            {actions}
          </HStack>
        ) : undefined
      }
    />
  );
}

/** The display list's bar: the same shell with "Displays" as the current page. */
export function AdminHeader(props: { actions?: ReactNode }) {
  return <AppBar crumbs={[{ id: "displays", label: "Displays" }]} actions={props.actions} />;
}

/** The bar for pages inside a display (management sections and the view editor). */
export function DisplayHeader(props: {
  crumbs: AdminCrumb[];
  actions?: ReactNode;
  toolsRef?: (element: HTMLElement | null) => void;
}) {
  return <AppBar crumbs={props.crumbs} actions={props.actions} toolsRef={props.toolsRef} />;
}

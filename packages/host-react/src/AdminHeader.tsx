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
 * The primary app bar every admin page shares, full width: the logo (links home) on the left and
 * app-level actions on the right.
 */
export function AdminHeader(props: { actions?: ReactNode }) {
  const { actions } = props;
  const { productName } = useHomeslateHost();
  return (
    <TopNav
      label="Primary"
      className={classes.topNav}
      heading={<TopNav.Heading heading={<LogoMark productName={productName} />} headingHref="/" />}
      endContent={
        actions ? (
          <HStack gap="sm" align="center">
            {actions}
          </HStack>
        ) : undefined
      }
    />
  );
}

/**
 * The secondary app bar shared by the display management page and the view editor: where you are
 * (breadcrumb trail) on the left, display-level actions on the right.
 */
export function DisplayBar(props: {
  crumbs: AdminCrumb[];
  actions?: ReactNode;
  /** Receives the element that hosts page tools (for example the view editor's toolbar). */
  toolsRef?: (element: HTMLElement | null) => void;
}) {
  const { crumbs, actions, toolsRef } = props;
  return (
    <div className={classes.subbar}>
      <Breadcrumbs label="You are here" separator="/" items={crumbs} />
      <div className={classes.subbarEnd}>
        {toolsRef ? <div ref={toolsRef} className={classes.subbarTools} /> : null}
        {actions ? (
          <HStack gap="sm" align="center">
            {actions}
          </HStack>
        ) : null}
      </div>
    </div>
  );
}

/** Both bars, stacked, for the `topNav` slot of pages inside a display. */
export function DisplayHeader(props: {
  crumbs: AdminCrumb[];
  actions?: ReactNode;
  toolsRef?: (element: HTMLElement | null) => void;
}) {
  return (
    <>
      <AdminHeader />
      <DisplayBar crumbs={props.crumbs} actions={props.actions} toolsRef={props.toolsRef} />
    </>
  );
}

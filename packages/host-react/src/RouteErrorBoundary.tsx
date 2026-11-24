import { Component, Fragment, type ReactNode } from "react";
import { Button, Heading, Stack, Text } from "@var-ui/react";
import * as classes from "./RouteErrorBoundary.styles";

export type RouteErrorFallbackProps = {
  productName: string;
  onReload: () => void;
};

/** Full-page fallback so a route render failure is never a blank document. */
export function RouteErrorFallback({ productName, onReload }: RouteErrorFallbackProps) {
  return (
    <div role="alert" className={classes.page}>
      <Stack gap="md" align="center">
        <Text size="sm" tone="secondary">
          {productName}
        </Text>
        <Heading level={1}>Something went wrong</Heading>
        <Text>This page hit an error. Reload to try again.</Text>
        <Button tone="accent" appearance="solid" onClick={onReload}>
          Reload
        </Button>
        <a href="/">Back to displays</a>
      </Stack>
    </div>
  );
}

type RouteErrorBoundaryProps = {
  productName: string;
  /**
   * `reload` refreshes the page. `retry` remounts the children and leaves the
   * parent (and the kiosk's last document) mounted.
   */
  recovery?: "reload" | "retry";
  children: ReactNode;
};

type RouteErrorBoundaryState = {
  error: Error | null;
  resetKey: number;
};

/** What the boundary renders for a given state. Exported so node tests can apply a thrown error. */
export function routeErrorBoundaryContent(
  state: RouteErrorBoundaryState,
  props: { productName: string; children: ReactNode },
  onReload: () => void,
): ReactNode {
  if (state.error) {
    return <RouteErrorFallback productName={props.productName} onReload={onReload} />;
  }
  return <Fragment key={state.resetKey}>{props.children}</Fragment>;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: unknown): Pick<RouteErrorBoundaryState, "error"> {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown): void {
    if (import.meta.env.DEV) console.error(error);
  }

  reload = (): void => {
    if (this.props.recovery === "retry") {
      this.setState((state) => ({ error: null, resetKey: state.resetKey + 1 }));
      return;
    }
    if (typeof window !== "undefined") window.location.reload();
  };

  render(): ReactNode {
    return routeErrorBoundaryContent(this.state, this.props, this.reload);
  }
}

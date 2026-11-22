import type { WidgetRegistryApi } from "@homeslate/display/canvas";
import { Navigate, Route, BrowserRouter, Routes, useHref, useNavigate } from "react-router-dom";
import { RouterProvider } from "react-aria-components";
import { ToastProvider } from "@var-ui/react";
import { DisplayListPage, KioskPage } from "./pages";
import { DisplayLayout } from "./DisplayLayout";
import { ManageLayout } from "./ManageLayout";
import {
  DisplaySettingsPage,
  DisplayThemePage,
  DisplayViewsPage,
  ViewEditorPage,
} from "./displayPages";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { HomeslateHostProvider, useHomeslateHost, type HomeslateHostConfig } from "./hostContext";

export type HomeslateAppProps = {
  /** Shown in the display-list nav. Defaults to `"Homeslate"`. */
  productName?: string;
  /** Prefix for API calls. Defaults to `""` (same origin). */
  apiBaseUrl?: string;
  /** Registry passed to Editor and Display. Defaults to the global registry. */
  widgetRegistry?: WidgetRegistryApi;
};

/**
 * The routed homeslate app: display list (`/`), editor (`/edit/:id`), and kiosk
 * (`/d/:publicId`). Compose the exported pages yourself if you want different
 * chrome or routing.
 */
export function HomeslateApp({ productName, apiBaseUrl, widgetRegistry }: HomeslateAppProps = {}) {
  const config: HomeslateHostConfig = {
    apiBaseUrl: apiBaseUrl ?? "",
    productName: productName ?? "Homeslate",
    widgetRegistry,
  };

  return (
    <HomeslateHostProvider value={config}>
      <ToastProvider>
        <BrowserRouter>
          <HomeslateRoutes />
        </BrowserRouter>
      </ToastProvider>
    </HomeslateHostProvider>
  );
}

function HomeslateRoutes() {
  const navigate = useNavigate();
  const { productName } = useHomeslateHost();
  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <Routes>
        <Route path="/" element={<DisplayListPage />} />
        <Route
          path="/edit/:id"
          element={
            <RouteErrorBoundary productName={productName}>
              <DisplayLayout />
            </RouteErrorBoundary>
          }
        >
          <Route element={<ManageLayout />}>
            <Route index element={<DisplayViewsPage />} />
            <Route path="settings" element={<DisplaySettingsPage />} />
            <Route path="theme" element={<DisplayThemePage />} />
          </Route>
          <Route path="views/:viewId" element={<ViewEditorPage />} />
        </Route>
        <Route
          path="/d/:publicId"
          element={
            <RouteErrorBoundary productName={productName}>
              <KioskPage />
            </RouteErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouterProvider>
  );
}

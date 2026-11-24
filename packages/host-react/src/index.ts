export const HOST_REACT_PACKAGE_NAME = "@homeslate/host-react";

export { HomeslateApp } from "./HomeslateApp";
export type { HomeslateAppProps } from "./HomeslateApp";
export { DisplayListPage, KioskPage } from "./pages";
export { DisplayLayout, useDisplay } from "./DisplayLayout";
export type { DisplayContextValue } from "./DisplayLayout";
export { ManageLayout } from "./ManageLayout";
export type { ManageSection } from "./manageSections";
export {
  DisplaySettingsPage,
  DisplayThemePage,
  DisplayViewsPage,
  ViewEditorPage,
} from "./displayPages";
export { RouteErrorBoundary, RouteErrorFallback } from "./RouteErrorBoundary";
export { TemplatePicker } from "./TemplatePicker";
export { HomeslateGoogleRuntime } from "./HomeslateGoogleRuntime";
export type { HomeslateGoogleRuntimeProps } from "./HomeslateGoogleRuntime";
export { DEFAULT_HOMESLATE_HOST, HomeslateHostProvider, useHomeslateHost } from "./hostContext";
export type { HomeslateHostConfig } from "./hostContext";
export { useDisplayDocument } from "./useDisplayDocument";
export type { DisplayDocumentState } from "./useDisplayDocument";
export { createDebouncedPersist } from "./createDebouncedPersist";
export type { DebouncedPersist, PersistPutOptions } from "./createDebouncedPersist";
export {
  errorMessage,
  getJson,
  getPublicDocument,
  joinUrl,
  patchJson,
  createDisplay,
  postJson,
  publicDocumentUrl,
  putJson,
  readError,
  setDisplayPasscode,
} from "./api";
export type { DisplayRecord, DisplaySummary, KioskDocumentResult } from "./api";
export { loadLastDocument, saveLastDocument, clearLastDocument } from "./lastDocument";
export { OfflineBanner, offlineBannerMessage } from "./OfflineBanner";
export { useOnlineStatus } from "./useOnlineStatus";
export { useKioskWatchdog, kioskWatchdogDecision } from "./useKioskWatchdog";

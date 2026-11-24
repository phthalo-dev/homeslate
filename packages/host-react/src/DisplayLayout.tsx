import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, useMatch, useParams } from "react-router-dom";
import {
  AppShell,
  Button,
  Heading,
  HStack,
  IconButton,
  Skeleton,
  Spinner,
  Text,
  TextField,
  Tooltip,
} from "@var-ui/react";
import { IconCheck, IconDownload, IconEdit, IconX } from "@tabler/icons-react";
import type { DisplayDocument } from "@homeslate/schema";
import { exportDocument } from "@homeslate/display/canvas";
import { DisplayHeader, type AdminCrumb } from "./AdminHeader";
import { HomeslateGoogleRuntime } from "./HomeslateGoogleRuntime";
import { setDisplayPasscode, type DisplayRecord } from "./api";
import { useHomeslateHost } from "./hostContext";
import { useDisplayDocument } from "./useDisplayDocument";
import * as classes from "./pages.styles";
import * as shared from "./shared.styles";
import { MANAGE_SECTIONS, sectionFromPath, type ManageSection } from "./manageSections";

/** What the display pages share: the loaded display plus the editing helpers. */
export type DisplayContextValue = {
  record: DisplayRecord;
  document: DisplayDocument;
  passcodeEnabled: boolean;
  saveError: string | null;
  setDocument: (next: DisplayDocument) => void;
  setPasscode: (passcode: string | null) => Promise<void>;
  /** Where the view editor mounts its toolbar (in the secondary app bar). */
  toolbarSlot: HTMLElement | null;
};

const DisplayContext = createContext<DisplayContextValue | null>(null);

/** The display loaded by the surrounding `DisplayLayout`. Throws outside one. */
export function useDisplay(): DisplayContextValue {
  const value = useContext(DisplayContext);
  if (!value) throw new Error("useDisplay must be used inside DisplayLayout");
  return value;
}

function exportFilename(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "display"}.json`;
}

function exportDisplayJson(document: DisplayDocument) {
  const blob = new Blob([exportDocument(document)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = exportFilename(document.name);
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Inline display-name editor for the breadcrumb trail. */
function DisplayNameHeading(props: { name: string; onRename: (name: string) => void }) {
  const { name, onRename } = props;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  /** Close the inline editor and hand focus back to the Rename button. */
  const stopEditing = () => {
    setEditing(false);
    requestAnimationFrame(() => {
      window.document.getElementById("rename-display")?.focus();
    });
  };

  const commit = () => {
    const trimmed = value.trim();
    stopEditing();
    if (trimmed && trimmed !== name) onRename(trimmed);
  };

  if (!editing) {
    return (
      <HStack gap="xs" align="center">
        <Heading level={1} size="xs">
          {name}
        </Heading>
        <Tooltip.Root>
          <Tooltip.Trigger>
            <IconButton
              icon={<IconEdit size={14} />}
              appearance="ghost"
              size="sm"
              id="rename-display"
              aria-label="Rename display"
              onClick={() => {
                setValue(name);
                setEditing(true);
              }}
            />
          </Tooltip.Trigger>
          <Tooltip.Popup>Rename display</Tooltip.Popup>
        </Tooltip.Root>
      </HStack>
    );
  }

  return (
    <HStack gap="xs" align="center">
      <TextField
        aria-label="Display name"
        size="sm"
        value={value}
        autoFocus
        onValueChange={setValue}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") stopEditing();
        }}
      />
      <IconButton
        icon={<IconCheck size={14} />}
        appearance="ghost"
        size="sm"
        aria-label="Save display name"
        onClick={commit}
      />
      <IconButton
        icon={<IconX size={14} />}
        appearance="ghost"
        size="sm"
        aria-label="Cancel rename"
        onClick={stopEditing}
      />
    </HStack>
  );
}

/**
 * Route layout for everything under `/edit/:id`: loads the display once and renders the app bar,
 * the secondary bar, and (for the management sections) the left nav. Because it sits above the
 * child routes, the bars and nav stay mounted while you move between management and a view editor.
 */
export function DisplayLayout() {
  const { id } = useParams<{ id: string }>();
  const { apiBaseUrl } = useHomeslateHost();
  const { pathname } = useLocation();
  const viewMatch = useMatch("/edit/:id/views/:viewId");
  const state = useDisplayDocument(apiBaseUrl, id);
  const { record, document, passcodeEnabled, error, saveError, setDocument, setPasscodeEnabled } =
    state;
  const [toolbarSlot, setToolbarSlot] = useState<HTMLElement | null>(null);

  const inViewEditor = viewMatch !== null;
  const section: ManageSection | null = inViewEditor ? null : sectionFromPath(pathname);

  const setPasscode = useCallback(
    async (passcode: string | null) => {
      if (!id) return;
      await setDisplayPasscode(apiBaseUrl, id, passcode);
      setPasscodeEnabled(passcode !== null);
    },
    [apiBaseUrl, id, setPasscodeEnabled],
  );

  const viewName = document?.views.find((view) => view.id === viewMatch?.params.viewId)?.name;
  const pageTitle = document
    ? inViewEditor
      ? `${viewName ?? document.views[0]?.name ?? "Edit view"} · ${document.name}`
      : `${MANAGE_SECTIONS.find((item) => item.id === section)?.label} · ${document.name}`
    : "Homeslate";
  useEffect(() => {
    window.document.title = pageTitle;
  }, [pageTitle]);

  const loaded = record && document ? { record, document } : null;
  const placeholder = <Skeleton className={classes.crumbSkeleton} aria-hidden />;

  const crumbs: AdminCrumb[] = [{ id: "displays", label: "Displays", href: "/" }];
  if (loaded) {
    crumbs.push(
      inViewEditor
        ? { id: "display", label: loaded.document.name, href: `/edit/${loaded.record.id}` }
        : {
            id: "display",
            label: (
              <DisplayNameHeading
                name={loaded.document.name}
                onRename={(name) => setDocument({ ...loaded.document, name })}
              />
            ),
          },
    );
    if (inViewEditor) {
      const current = loaded.document.views.find((view) => view.id === viewMatch?.params.viewId);
      crumbs.push({
        id: "view",
        label: (
          <Heading level={1} size="xs">
            {current?.name ?? loaded.document.views[0]?.name ?? "View"}
          </Heading>
        ),
      });
    }
  } else {
    crumbs.push({ id: "display", label: error ? "Unavailable" : placeholder });
    if (inViewEditor) crumbs.push({ id: "view", label: error ? "View" : placeholder });
  }

  const actions = loaded ? (
    <>
      {saveError && (
        <Text as="span" size="sm" role="alert">
          Not saved: {saveError}
        </Text>
      )}
      <Tooltip.Root>
        <Tooltip.Trigger>
          <IconButton
            icon={<IconDownload size={16} />}
            appearance="ghost"
            size="sm"
            aria-label="Export JSON"
            onClick={() => exportDisplayJson(loaded.document)}
          />
        </Tooltip.Trigger>
        <Tooltip.Popup>Export JSON</Tooltip.Popup>
      </Tooltip.Root>
      <Button size="sm" href={`/d/${loaded.record.publicId}`}>
        Kiosk
      </Button>
    </>
  ) : undefined;

  let body: ReactNode;
  if (error) {
    body = (
      <Text role="alert" className={shared.alertPad}>
        {error}
      </Text>
    );
  } else if (!loaded) {
    body = (
      <div className={classes.pending} role="status" aria-label="Loading display">
        <Spinner />
      </div>
    );
  } else {
    body = (
      <DisplayContext.Provider
        value={{
          record: loaded.record,
          document: loaded.document,
          passcodeEnabled,
          saveError,
          setDocument,
          setPasscode,
          toolbarSlot,
        }}
      >
        <HomeslateGoogleRuntime displayId={loaded.record.publicId} apiBaseUrl={apiBaseUrl}>
          <Outlet />
        </HomeslateGoogleRuntime>
      </DisplayContext.Provider>
    );
  }

  return (
    <AppShell
      variant="wash"
      contentPadding="none"
      topNav={
        <DisplayHeader
          crumbs={crumbs}
          actions={actions}
          toolsRef={inViewEditor ? setToolbarSlot : undefined}
        />
      }
    >
      {body}
    </AppShell>
  );
}

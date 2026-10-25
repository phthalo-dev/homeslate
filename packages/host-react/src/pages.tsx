import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AppShell,
  Badge,
  Button,
  Heading,
  HStack,
  IconButton,
  Link,
  PinInput,
  SimpleTooltip,
  Spinner,
  Stack,
  Surface,
  Tabs,
  Text,
  TextField,
  TopNav,
} from "@var-ui/react";
import { IconCheck, IconEdit, IconX } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { OfflineBanner } from "./OfflineBanner";
import { loadLastDocument, saveLastDocument } from "./lastDocument";
import { useOnlineStatus } from "./useOnlineStatus";
import { useKioskWatchdog } from "./useKioskWatchdog";
import type { DisplayDocument, ThemeDocument } from "@homeslate/schema";
import { Editor, ThemeEditor } from "@homeslate/editor";
import { Display } from "@homeslate/display";
import {
  duplicateDocument,
  exportDocument,
  parseImportedDocument,
} from "@homeslate/display/canvas";
import {
  createDisplay,
  errorMessage,
  getJson,
  getPublicDocument,
  joinUrl,
  publicDocumentUrl,
  putJson,
  setDisplayPasscode,
  type DisplayRecord,
  type DisplaySummary,
} from "./api";
import { DisplaySettingsPanel } from "./DisplaySettingsPanel";
import { HomeslateGoogleRuntime } from "./HomeslateGoogleRuntime";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { TemplatePicker } from "./TemplatePicker";
import { useDisplayDocument } from "./useDisplayDocument";
import { ViewsPanel } from "./ViewsPanel";
import { useHomeslateHost } from "./hostContext";

const KIOSK_POLL_MS = 10_000;

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

function importError(errors: Array<{ path: string; message: string }>): string {
  return errors.map((issue) => [issue.path, issue.message].filter(Boolean).join(": ")).join("; ");
}

const KIOSK_SAVE_ERROR_STYLE: CSSProperties = {
  position: "fixed",
  insetInline: 0,
  top: 0,
  zIndex: 1000,
  textAlign: "center",
  background: "rgba(0, 0, 0, 0.75)",
};

type ListedDisplay = DisplaySummary & {
  publicId?: string;
  passcodeEnabled?: boolean;
  document?: DisplayDocument;
};

/** Lists displays and offers a "New display" button. */
export function DisplayListPage() {
  const navigate = useNavigate();
  const { apiBaseUrl, productName } = useHomeslateHost();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displays, setDisplays] = useState<ListedDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await getJson<DisplaySummary[]>(joinUrl(apiBaseUrl, "/api/displays"));
        const withRecords = await Promise.all(
          list.map(async (item) => {
            const record = await getJson<DisplayRecord>(
              joinUrl(apiBaseUrl, `/api/displays/${item.id}`),
            );
            return {
              ...item,
              publicId: record.publicId,
              passcodeEnabled: record.passcodeEnabled ?? false,
              document: record.document,
            };
          }),
        );
        if (!cancelled) setDisplays(withRecords);
      } catch (cause) {
        if (!cancelled) setError(errorMessage(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  const createFromDocument = async (document: DisplayDocument) => {
    setCreating(true);
    setPickerError(null);
    setError(null);
    try {
      const record = await createDisplay(apiBaseUrl, document);
      navigate(`/edit/${record.id}`);
    } catch (cause) {
      setPickerError(errorMessage(cause));
      setCreating(false);
    }
  };

  const importDisplay = async (file: File) => {
    setError(null);
    try {
      const parsed = parseImportedDocument(await file.text());
      if (!parsed.ok) {
        setError(importError(parsed.errors));
        return;
      }
      setCreating(true);
      const record = await createDisplay(apiBaseUrl, parsed.document);
      navigate(`/edit/${record.id}`);
    } catch (cause) {
      setError(errorMessage(cause));
      setCreating(false);
    }
  };

  const duplicateDisplay = async (display: ListedDisplay) => {
    if (!display.document) return;
    setDuplicatingId(display.id);
    setError(null);
    try {
      const record = await createDisplay(apiBaseUrl, duplicateDocument(display.document));
      navigate(`/edit/${record.id}`);
    } catch (cause) {
      setError(errorMessage(cause));
      setDuplicatingId(null);
    }
  };

  return (
    <AppShell
      contentPadding={4}
      topNav={
        <TopNav
          heading={<TopNav.Heading heading={productName} />}
          endContent={
            <HStack gap="sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                hidden
                aria-label="Import display JSON"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void importDisplay(file);
                }}
              />
              <Button size="sm" onPress={() => fileInputRef.current?.click()} isDisabled={creating}>
                Import
              </Button>
              <Button
                tone="accent"
                appearance="filled"
                onPress={() => {
                  setPickerError(null);
                  setPickerOpen(true);
                }}
                isPending={creating}
              >
                New display
              </Button>
            </HStack>
          }
        />
      }
    >
      {loading && <Spinner />}
      {error && <Text role="alert">{error}</Text>}
      {!loading && displays.length === 0 && (
        <Text tone="secondary">No displays yet. Create one to open the editor.</Text>
      )}
      <Stack gap="sm">
        {displays.map((display) => (
          <HStack key={display.id} justify="between">
            <Text>{display.name}</Text>
            <HStack gap="md">
              {display.passcodeEnabled && <Badge tone="neutral">PIN</Badge>}
              <Button
                appearance="ghost"
                size="sm"
                isDisabled={!display.document || duplicatingId === display.id}
                onPress={() => void duplicateDisplay(display)}
              >
                Duplicate
              </Button>
              <Link href={`/edit/${display.id}`}>Manage</Link>
              {display.publicId && <Link href={`/d/${display.publicId}`}>Kiosk</Link>}
            </HStack>
          </HStack>
        ))}
      </Stack>
      <TemplatePicker
        isOpen={pickerOpen}
        isPending={creating}
        error={pickerError}
        onOpenChange={setPickerOpen}
        onCreate={(document) => void createFromDocument(document)}
      />
    </AppShell>
  );
}

type ManagementTab = "views" | "settings" | "theme";

/** Inline display-name editor for the management header. */
function DisplayNameHeading(props: { name: string; onRename: (name: string) => void }) {
  const { name, onRename } = props;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  const commit = () => {
    const trimmed = value.trim();
    setEditing(false);
    if (trimmed && trimmed !== name) onRename(trimmed);
  };

  if (!editing) {
    return (
      <HStack gap="xs" align="center">
        <Heading level={4}>{name}</Heading>
        <SimpleTooltip content="Rename display">
          <IconButton
            name="wrench"
            icon={<IconEdit size={14} />}
            appearance="ghost"
            size="sm"
            aria-label="Rename display"
            onPress={() => {
              setValue(name);
              setEditing(true);
            }}
          />
        </SimpleTooltip>
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
        onChange={setValue}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") setEditing(false);
        }}
      />
      <IconButton
        name="check"
        icon={<IconCheck size={14} />}
        appearance="ghost"
        size="sm"
        aria-label="Save display name"
        onPress={commit}
      />
      <IconButton
        name="close"
        icon={<IconX size={14} />}
        appearance="ghost"
        size="sm"
        aria-label="Cancel rename"
        onPress={() => setEditing(false)}
      />
    </HStack>
  );
}

/** Display management: manage views, display settings, and themes. */
export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { apiBaseUrl } = useHomeslateHost();
  const { record, document, passcodeEnabled, error, saveError, setDocument, setPasscodeEnabled } =
    useDisplayDocument(apiBaseUrl, id);
  const [tab, setTab] = useState<ManagementTab>("views");

  const setPasscode = useCallback(
    async (passcode: string | null) => {
      if (!id) return;
      await setDisplayPasscode(apiBaseUrl, id, passcode);
      setPasscodeEnabled(passcode !== null);
    },
    [apiBaseUrl, id, setPasscodeEnabled],
  );

  if (error)
    return (
      <Text role="alert" style={{ padding: "1rem" }}>
        {error}
      </Text>
    );
  if (!record || !document) return <Spinner />;

  const tabs = [
    {
      id: "views",
      label: "Views",
      content: (
        <ViewsPanel
          document={document}
          onChange={setDocument}
          onOpenView={(viewId) => navigate(`/edit/${record.id}/views/${viewId}`)}
        />
      ),
    },
    {
      id: "settings",
      label: "Settings",
      content: (
        <DisplaySettingsPanel
          document={document}
          onChange={setDocument}
          passcodeEnabled={passcodeEnabled}
          onSetPasscode={setPasscode}
        />
      ),
    },
    {
      id: "theme",
      label: "Theme",
      content: (
        <ThemeEditor
          documents={document.themes as ThemeDocument[]}
          activeThemeDocumentId={document.activeThemeId}
          previewViews={document.views}
          initialPreviewViewId={document.activeViewId}
          onChange={(themes, activeThemeId) => setDocument({ ...document, themes, activeThemeId })}
        />
      ),
    },
  ];

  return (
    <HomeslateGoogleRuntime displayId={record.publicId} apiBaseUrl={apiBaseUrl}>
      <AppShell
        contentPadding={4}
        topNav={
          <TopNav
            heading={
              <HStack gap="md">
                <Link href="/">Displays</Link>
                <DisplayNameHeading
                  name={document.name}
                  onRename={(name) => setDocument({ ...document, name })}
                />
              </HStack>
            }
            endContent={
              <HStack gap="md">
                {saveError && (
                  <Text as="span" size="sm" role="alert">
                    Not saved: {saveError}
                  </Text>
                )}
                <Button size="sm" onPress={() => exportDisplayJson(document)}>
                  Export JSON
                </Button>
                <Link href={`/d/${record.publicId}`}>Open kiosk</Link>
              </HStack>
            }
          />
        }
      >
        <Tabs
          tabs={tabs}
          selectedKey={tab}
          onSelectionChange={(key) => setTab(String(key) as ManagementTab)}
        />
      </AppShell>
    </HomeslateGoogleRuntime>
  );
}

/** Per-view canvas editor. Renders `@homeslate/editor` for one view. */
export function ViewEditorPage() {
  const { id, viewId } = useParams<{ id: string; viewId: string }>();
  const { apiBaseUrl, widgetRegistry } = useHomeslateHost();
  const { record, document, error, saveError, setDocument } = useDisplayDocument(apiBaseUrl, id);

  if (error)
    return (
      <Text role="alert" style={{ padding: "1rem" }}>
        {error}
      </Text>
    );
  if (!record || !document) return <Spinner />;

  const view = document.views.find((candidate) => candidate.id === viewId) ?? document.views[0];
  if (!view) {
    return (
      <AppShell contentPadding={4}>
        <Text role="alert">This display has no views yet.</Text>
      </AppShell>
    );
  }

  return (
    <HomeslateGoogleRuntime displayId={record.publicId} apiBaseUrl={apiBaseUrl}>
      <AppShell
        contentPadding={0}
        topNav={
          <TopNav
            heading={
              <HStack gap="md">
                <Link href={`/edit/${record.id}`}>Views</Link>
                <Heading level={4}>{view.name}</Heading>
              </HStack>
            }
            endContent={
              <HStack gap="md">
                {saveError && (
                  <Text as="span" size="sm" role="alert">
                    Not saved: {saveError}
                  </Text>
                )}
                <Button size="sm" onPress={() => exportDisplayJson(document)}>
                  Export JSON
                </Button>
                <Link href={`/d/${record.publicId}`}>Open kiosk</Link>
              </HStack>
            }
          />
        }
      >
        <div style={{ height: "100%", display: "flex" }}>
          <Editor
            document={document}
            viewId={view.id}
            widgetRegistry={widgetRegistry}
            onChange={setDocument}
          />
        </div>
      </AppShell>
    </HomeslateGoogleRuntime>
  );
}

/** Kiosk route. Polls the public document, gated by the viewer passcode. */
export function KioskPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const { apiBaseUrl, productName, widgetRegistry } = useHomeslateHost();
  const online = useOnlineStatus();
  const [document, setDocument] = useState<DisplayDocument | null>(() =>
    publicId ? (loadLastDocument(publicId)?.document ?? null) : null,
  );
  const [showingSaved, setShowingSaved] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [failedHeartbeats, setFailedHeartbeats] = useState(0);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [passcode, setPasscode] = useState<string | null>(null);
  const [passcodeRequired, setPasscodeRequired] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const documentRef = useRef(document);
  documentRef.current = document;
  useKioskWatchdog({ online, failedHeartbeats, lastLoadedAt });

  const load = useCallback(
    async (candidate: string | null) => {
      if (!publicId) return;
      try {
        const result = await getPublicDocument(apiBaseUrl, publicId, candidate);
        if (result.status === "passcode-required") {
          setPasscodeRequired(true);
          if (candidate) {
            setPinError(true);
            setPinValue("");
          }
          return;
        }
        setPasscodeRequired(false);
        setPinError(false);
        setDocument(result.document);
        saveLastDocument(publicId, result.document);
        setShowingSaved(false);
        setLoadFailed(false);
        setFailedHeartbeats(0);
        setLastLoadedAt(Date.now());
        setError(null);
      } catch (cause) {
        setFailedHeartbeats((count) => count + 1);
        setLoadFailed(true);
        if (documentRef.current) {
          setShowingSaved(true);
          setError(null);
        } else {
          setError(errorMessage(cause));
        }
      }
    },
    [apiBaseUrl, publicId],
  );

  useEffect(() => {
    void load(passcode);
    const interval = setInterval(() => void load(passcode), KIOSK_POLL_MS);
    return () => clearInterval(interval);
  }, [load, passcode]);

  useEffect(() => {
    const onOnline = () => void load(passcode);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [load, passcode]);

  const onChange = useCallback(
    (next: DisplayDocument) => {
      setDocument(next);
      if (!publicId) return;
      void putJson(publicDocumentUrl(apiBaseUrl, publicId, passcode), next).then(
        () => setSaveError(null),
        (cause: unknown) => setSaveError(errorMessage(cause)),
      );
    },
    [apiBaseUrl, publicId, passcode],
  );

  if (passcodeRequired) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: "100vh", padding: "1rem" }}>
        <Surface padding="md">
          <Stack gap="md" align="center">
            <Text weight="semibold">Enter passcode</Text>
            <Text size="sm" tone="secondary">
              This display is locked with a 4-digit PIN.
            </Text>
            <PinInput
              length={4}
              type="numeric"
              autoFocus
              aria-label="Display passcode"
              value={pinValue}
              errorMessage={pinError ? "Incorrect PIN" : undefined}
              onChange={(value) => {
                setPinValue(value);
                setPinError(false);
              }}
              onComplete={(value) => setPasscode(value)}
            />
            <Button
              tone="accent"
              appearance="filled"
              size="sm"
              isDisabled={pinValue.length !== 4}
              onPress={() => setPasscode(pinValue)}
            >
              Unlock
            </Button>
          </Stack>
        </Surface>
      </Stack>
    );
  }

  if (error && !document)
    return (
      <Text role="alert" style={{ padding: "1rem" }}>
        {error}
      </Text>
    );
  if (!document || !publicId) return <Spinner />;

  return (
    <HomeslateGoogleRuntime displayId={publicId} apiBaseUrl={apiBaseUrl}>
      <OfflineBanner online={online} loadFailed={loadFailed} showingSaved={showingSaved} />
      {saveError && (
        <Text as="span" size="sm" role="alert" style={KIOSK_SAVE_ERROR_STYLE}>
          Not saved: {saveError}
        </Text>
      )}
      <RouteErrorBoundary productName={productName} recovery="retry">
        <Display document={document} widgetRegistry={widgetRegistry} onChange={onChange} />
      </RouteErrorBoundary>
    </HomeslateGoogleRuntime>
  );
}

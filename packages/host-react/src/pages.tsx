import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppShell,
  Badge,
  Button,
  EmptyState,
  Heading,
  HStack,
  PinInput,
  Spinner,
  Stack,
  Surface,
  Text,
} from "@var-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminHeader } from "./AdminHeader";
import * as classes from "./pages.styles";
import * as shared from "./shared.styles";
import { OfflineBanner } from "./OfflineBanner";
import { loadLastDocument, saveLastDocument } from "./lastDocument";
import { useOnlineStatus } from "./useOnlineStatus";
import { useKioskWatchdog } from "./useKioskWatchdog";
import type { DisplayDocument } from "@homeslate/schema";
import { Display } from "@homeslate/display";
import { duplicateDocument, parseImportedDocument } from "@homeslate/display/canvas";
import {
  createDisplay,
  errorMessage,
  getJson,
  getPublicDocument,
  joinUrl,
  publicDocumentUrl,
  putJson,
  type DisplayRecord,
  type DisplaySummary,
} from "./api";
import { HomeslateGoogleRuntime } from "./HomeslateGoogleRuntime";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { TemplatePicker } from "./TemplatePicker";
import { useHomeslateHost } from "./hostContext";

const KIOSK_POLL_MS = 10_000;

function importError(errors: Array<{ path: string; message: string }>): string {
  return errors.map((issue) => [issue.path, issue.message].filter(Boolean).join(": ")).join("; ");
}

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
  useEffect(() => {
    window.document.title = `Displays · ${productName}`;
  }, [productName]);
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

  // On an empty list the empty state owns the one primary action.
  const emptyList = !loading && !error && displays.length === 0;

  return (
    <AppShell
      variant="wash"
      contentPadding="md"
      topNav={
        <AdminHeader
          actions={
            <>
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
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={creating}>
                Import
              </Button>
              <Button
                tone={emptyList ? undefined : "accent"}
                appearance={emptyList ? undefined : "solid"}
                size="sm"
                onClick={() => {
                  setPickerError(null);
                  setPickerOpen(true);
                }}
                loading={creating}
              >
                New display
              </Button>
            </>
          }
        />
      }
    >
      <Stack gap="lg" className={classes.pageColumn}>
        <Heading level={1} size="lg">
          Displays
        </Heading>
        {loading && <Spinner />}
        {error && <Text role="alert">{error}</Text>}
        {!loading && !error && displays.length === 0 && (
          <EmptyState
            title="No displays yet"
            description="Create a display to start arranging widgets for your wall screen."
            action={
              <Button
                tone="accent"
                appearance="solid"
                onClick={() => {
                  setPickerError(null);
                  setPickerOpen(true);
                }}
              >
                New display
              </Button>
            }
          />
        )}
        <Stack gap="sm">
          {displays.map((display) => {
            const viewCount = display.document?.views.length;
            return (
              <Surface key={display.id} padding="md">
                <HStack justify="between" align="center" gap="md" wrap>
                  <Stack gap="xs" className={shared.shrinkable}>
                    <HStack gap="sm" align="center">
                      <Heading level={2} size="sm">
                        {display.name}
                      </Heading>
                      {display.passcodeEnabled && <Badge tone="neutral">PIN</Badge>}
                    </HStack>
                    {viewCount !== undefined && (
                      <Text size="sm" tone="secondary">
                        {viewCount} {viewCount === 1 ? "view" : "views"}
                      </Text>
                    )}
                  </Stack>
                  <HStack gap="sm" align="center" wrap>
                    <Button
                      size="sm"
                      appearance="ghost"
                      aria-label={`Duplicate ${display.name}`}
                      disabled={!display.document || duplicatingId === display.id}
                      onClick={() => void duplicateDisplay(display)}
                    >
                      Duplicate
                    </Button>
                    {display.publicId && (
                      <Button
                        size="sm"
                        appearance="ghost"
                        aria-label={`Open kiosk for ${display.name}`}
                        href={`/d/${display.publicId}`}
                      >
                        Kiosk
                      </Button>
                    )}
                    <Button
                      size="sm"
                      aria-label={`Manage ${display.name}`}
                      href={`/edit/${display.id}`}
                    >
                      Manage
                    </Button>
                  </HStack>
                </HStack>
              </Surface>
            );
          })}
        </Stack>
      </Stack>
      <TemplatePicker
        open={pickerOpen}
        loading={creating}
        error={pickerError}
        onOpenChange={setPickerOpen}
        onCreate={(document) => void createFromDocument(document)}
      />
    </AppShell>
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
      <Stack align="center" justify="center" className={classes.kioskCenter}>
        <Surface padding="md">
          <Stack gap="md" align="center">
            <Text weight="semibold">Enter passcode</Text>
            <Text size="sm" tone="secondary">
              This display is locked with a 4-digit PIN.
            </Text>
            <PinInput
              length={4}
              characters="numeric"
              autoFocus
              aria-label="Display passcode"
              value={pinValue}
              errorMessage={pinError ? "Incorrect PIN" : undefined}
              onValueChange={(value) => {
                setPinValue(value);
                setPinError(false);
              }}
              onComplete={(value) => setPasscode(value)}
            />
            <Button
              tone="accent"
              appearance="solid"
              size="sm"
              disabled={pinValue.length !== 4}
              onClick={() => setPasscode(pinValue)}
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
      <Text role="alert" className={shared.alertPad}>
        {error}
      </Text>
    );
  if (!document || !publicId) return <Spinner />;

  return (
    <HomeslateGoogleRuntime displayId={publicId} apiBaseUrl={apiBaseUrl}>
      <OfflineBanner online={online} loadFailed={loadFailed} showingSaved={showingSaved} />
      {saveError && (
        <Text as="span" size="sm" role="alert" className={classes.kioskSaveError}>
          Not saved: {saveError}
        </Text>
      )}
      <RouteErrorBoundary productName={productName} recovery="retry">
        <Display document={document} widgetRegistry={widgetRegistry} onChange={onChange} />
      </RouteErrorBoundary>
    </HomeslateGoogleRuntime>
  );
}

import { useEffect, useMemo, useRef, useState, type JSX, type Key } from "react";
import {
  Alert,
  Badge,
  Button,
  Code,
  ColorInput,
  DesignSystemProvider,
  Dialog,
  HStack,
  IconButton,
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleTooltip,
  Stack,
  Surface,
  Tabs,
  Text,
  TextAreaField,
  TextField,
  Typeahead,
} from "@var-ui/react";
import {
  OverlayPortalContext,
  useDebouncedValue,
  useOverlayPortalContainer,
} from "@homeslate/widgets";
import {
  IconAlertCircle,
  IconCheck,
  IconColorPicker,
  IconEdit,
  IconLink,
  IconPalette,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import {
  validateThemeDocument,
  type ColorMode,
  type ThemeDocument,
  type ThemeValidationIssue,
  type View,
} from "@homeslate/schema";
import {
  BackgroundSlideshow,
  createDisplayTheme,
  createInactivePreviewThemeDispose,
  DocumentCanvas,
  getCanvasBackgroundStyle,
  previewDisplayThemeName,
  getPresetById,
  THEME_PRESET_OPTIONS,
  TAILWIND_COLOR_PALETTES,
  TAILWIND_COMPACT_COLOR_SWATCHES,
  TAILWIND_PALETTE_NAMES,
  TAILWIND_PALETTE_STEPS,
} from "@homeslate/display/canvas";
import {
  buildReferenceOptions,
  getEditableTokenEntries,
  getWidgetTokenSections,
  setTokenValue,
  tokenCssVarName,
  type EditableTokenEntry,
  type EditableTokenType,
  type ReferenceOption,
} from "./themeEditorModel";
import * as classes from "./ThemeEditor.styles";

function createThemeDocumentFromPreset(presetId: string, name: string): ThemeDocument {
  const base = getPresetById(presetId);
  return {
    ...base,
    id: `custom_${Date.now()}`,
    name,
    isActive: false,
  };
}

function ThemePreviewIsland(props: {
  doc: ThemeDocument;
  colorMode: ColorMode;
  view: View | null;
}): JSX.Element {
  const { doc, colorMode, view } = props;
  const debouncedDoc = useDebouncedValue(doc, 80);
  const tokensKey = JSON.stringify(debouncedDoc.tokens ?? null);
  const colorModeKey = JSON.stringify(debouncedDoc.colorMode ?? null);
  const extendKey = JSON.stringify(debouncedDoc.extend ?? null);
  const previewTheme = useMemo(
    () => createDisplayTheme(debouncedDoc, previewDisplayThemeName(debouncedDoc.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serialized token trees
    [debouncedDoc.id, tokensKey, colorModeKey, extendKey],
  );

  useEffect(() => {
    const id = debouncedDoc.id;
    return createInactivePreviewThemeDispose(id);
  }, [debouncedDoc.id]);

  const canvasBackground = getCanvasBackgroundStyle(debouncedDoc, colorMode);

  return (
    <DesignSystemProvider
      customTheme={previewTheme}
      colorMode={colorMode === "dark" ? "dark" : "light"}
    >
      <div className={classes.previewCanvas} style={canvasBackground}>
        {view ? (
          <div className={classes.actualPreviewViewport}>
            <BackgroundSlideshow view={view} />
            <DocumentCanvas view={view} isEditing={false} />
          </div>
        ) : (
          <>
            <div className={classes.previewToolbar}>Widget toolbar</div>
            <div className={classes.previewWidget}>
              <p className={classes.previewWidgetTitle}>Sample widget</p>
              <p className={classes.previewWidgetMuted}>Secondary text uses muted tokens.</p>
              <span className={classes.previewButton}>Accent button</span>
            </div>
          </>
        )}
      </div>
    </DesignSystemProvider>
  );
}

export type ThemeEditorProps = {
  documents: ThemeDocument[] | undefined;
  activeThemeDocumentId: string | null | undefined;
  previewViews?: View[];
  initialPreviewViewId?: string | null;
  onChange: (documents: ThemeDocument[], activeThemeDocumentId: string | null) => void;
};

const ALIAS_VALUE_RE = /^\{[\w.]+\}$/;

function withActiveFlags(
  documents: ThemeDocument[],
  activeThemeDocumentId: string | null,
): ThemeDocument[] {
  return documents.map((doc) => ({
    ...doc,
    isActive: activeThemeDocumentId !== null && doc.id === activeThemeDocumentId,
  }));
}

function uniqueId(base: string, existingIds: Set<string>): string {
  if (!existingIds.has(base)) return base;
  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function formatIssues(issues: ThemeValidationIssue[]): string {
  return issues
    .slice(0, 8)
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join("\n");
}

function getInitialThemeId(
  documents: ThemeDocument[],
  activeThemeDocumentId: string | null | undefined,
): string | null {
  if (activeThemeDocumentId && documents.some((doc) => doc.id === activeThemeDocumentId)) {
    return activeThemeDocumentId;
  }
  return documents[0]?.id ?? null;
}

interface TokenControlProps {
  entry: EditableTokenEntry;
  references: ReferenceOption[];
  onChange: (entry: EditableTokenEntry, value: string) => void;
}

function tokenTypeLabel(type: EditableTokenType): string {
  if (type === "fontFamily") return "Font family";
  if (type === "dimension") return "Dimension";
  return "Color";
}

function defaultDirectValue(type: EditableTokenType): string {
  if (type === "fontFamily") return "'Outfit', sans-serif";
  if (type === "dimension") return "12px";
  return "#6366f1";
}

function tailwindTokenPath(name: string, step: string): string {
  return `foundation.color.${name}.${step}`;
}

function canPreviewColorValue(value: string): boolean {
  return !ALIAS_VALUE_RE.test(value) && !value.includes("gradient");
}

const PRESET_SELECT_OPTIONS = THEME_PRESET_OPTIONS.map((option) => ({
  id: option.value,
  label: option.label,
}));

function TokenControl({ entry, references, onChange }: TokenControlProps) {
  const portalContainer = useOverlayPortalContainer();
  const isReference = ALIAS_VALUE_RE.test(entry.value);
  const referenceValue = references.some((option) => option.value === entry.value)
    ? entry.value
    : null;
  const referenceFallback = references[0]?.value;
  const typeLabel = tokenTypeLabel(entry.type);
  const cssVarName = tokenCssVarName(entry.referencePath);
  const [paletteBrowserOpen, setPaletteBrowserOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [referenceBrowserOpen, setReferenceBrowserOpen] = useState(false);
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const customColorValue = isReference ? defaultDirectValue("color") : entry.value;
  const filteredPaletteNames = useMemo(() => {
    const query = paletteQuery.trim().toLowerCase();
    if (!query) return TAILWIND_PALETTE_NAMES;

    return TAILWIND_PALETTE_NAMES.filter((name) =>
      TAILWIND_PALETTE_STEPS.some((step) => {
        const value = TAILWIND_COLOR_PALETTES[name][step];
        const tokenPath = tailwindTokenPath(name, step);
        return `${name} ${step} ${tokenPath} ${value}`.toLowerCase().includes(query);
      }),
    );
  }, [paletteQuery]);

  return (
    <Surface padding="sm" className={classes.colorTokenCard}>
      <Stack gap="xs">
        <div>
          <HStack justify="between" gap="xs" align="start">
            <Text size="sm" weight="semibold" className={classes.tokenLabel}>
              {entry.label}
            </Text>
            {entry.referencePath.startsWith("extend.widget.") && (
              <Badge appearance="subtle" tone="accent">
                Widget-related
              </Badge>
            )}
          </HStack>
          <Text size="xs" tone="secondary">
            {entry.referencePath}
          </Text>
          <Text size="xs" tone="secondary" className={classes.tokenCssVar}>
            CSS var <Code>{cssVarName}</Code>
          </Text>
        </div>

        {entry.type === "color" ? (
          <>
            <HStack gap="xs" align="end" className={classes.colorValueRow}>
              {canPreviewColorValue(entry.value) ? (
                <span className={classes.colorPreviewChip} style={{ background: entry.value }} />
              ) : null}
              <TextField
                label="Color value"
                size="sm"
                value={entry.value}
                onChange={(value) => onChange(entry, value)}
                placeholder="#6366f1, oklch(...), or {foundation.color.red.500}"
                className={classes.colorValueInput}
              />
              <HStack gap="xs" className={classes.colorSourceActions}>
                <SimpleTooltip content="Browse palettes" portalContainer={portalContainer}>
                  <IconButton
                    name="search"
                    icon={<IconPalette size={16} />}
                    appearance="ghost"
                    aria-label="Browse palettes"
                    onPress={() => setPaletteBrowserOpen(true)}
                  />
                </SimpleTooltip>
                <SimpleTooltip content="Reference another token" portalContainer={portalContainer}>
                  <IconButton
                    name="copy"
                    icon={<IconLink size={16} />}
                    appearance="ghost"
                    aria-label="Reference another token"
                    onPress={() => setReferenceBrowserOpen(true)}
                    isDisabled={references.length === 0}
                  />
                </SimpleTooltip>
                <SimpleTooltip content="Pick custom color" portalContainer={portalContainer}>
                  <IconButton
                    name="colorModeLight"
                    icon={<IconColorPicker size={16} />}
                    appearance="ghost"
                    aria-label="Pick custom color"
                    onPress={() => setCustomColorOpen(true)}
                  />
                </SimpleTooltip>
              </HStack>
            </HStack>
            <Dialog.Root
              isOpen={customColorOpen}
              onOpenChange={(isOpen) => {
                if (!isOpen) setCustomColorOpen(false);
              }}
              portalContainer={portalContainer}
            >
              <Dialog.Backdrop>
                <Dialog.Popup>
                  <Dialog.Title>Pick custom color</Dialog.Title>
                  <ColorInput
                    label="Color value"
                    size="sm"
                    value={customColorValue}
                    onChange={(value) => onChange(entry, value)}
                    placeholder="#6366f1"
                    swatches={TAILWIND_COMPACT_COLOR_SWATCHES}
                    portalContainer={portalContainer}
                  />
                </Dialog.Popup>
              </Dialog.Backdrop>
            </Dialog.Root>
            <Dialog.Root
              isOpen={referenceBrowserOpen}
              onOpenChange={(isOpen) => {
                if (!isOpen) setReferenceBrowserOpen(false);
              }}
              portalContainer={portalContainer}
            >
              <Dialog.Backdrop>
                <Dialog.Popup>
                  <Dialog.Title>Reference another token</Dialog.Title>
                  <Typeahead
                    label="Search token references"
                    options={references.map((option) => ({
                      id: option.value,
                      label: option.label,
                    }))}
                    selectedKey={referenceValue}
                    onSelectionChange={(key) => {
                      if (key == null) return;
                      onChange(entry, String(key));
                      setReferenceBrowserOpen(false);
                    }}
                    placeholder="Search token references"
                  />
                </Dialog.Popup>
              </Dialog.Backdrop>
            </Dialog.Root>
            <Dialog.Root
              isOpen={paletteBrowserOpen}
              onOpenChange={(isOpen) => {
                if (!isOpen) setPaletteBrowserOpen(false);
              }}
              portalContainer={portalContainer}
            >
              <Dialog.Backdrop>
                <Dialog.Popup>
                  <Dialog.Title>Browse palettes</Dialog.Title>
                  <Stack gap="sm">
                    <TextField
                      label="Search palettes, shades, paths, or OKLCH"
                      size="sm"
                      value={paletteQuery}
                      onChange={setPaletteQuery}
                      placeholder="red 500, foundation.color.sky.950, oklch..."
                    />
                    <Text size="xs" tone="secondary">
                      Pick a direct OKLCH value. Use the reference button if you want to keep the
                      token path instead.
                    </Text>
                    <div className={classes.paletteBrowserGrid}>
                      {filteredPaletteNames.map((name) => (
                        <div key={name} className={classes.paletteFamilyRow}>
                          <div className={classes.paletteFamilyLabel}>
                            <Text size="sm" weight="semibold">
                              {name}
                            </Text>
                            <Text size="xs" tone="secondary">
                              {`foundation.color.${name}`}
                            </Text>
                          </div>
                          <div className={classes.paletteShadeGrid}>
                            {TAILWIND_PALETTE_STEPS.map((step) => {
                              const value = TAILWIND_COLOR_PALETTES[name][step];
                              const tokenPath = tailwindTokenPath(name, step);
                              return (
                                <button
                                  key={step}
                                  type="button"
                                  className={classes.paletteShadeButton}
                                  onClick={() => {
                                    onChange(entry, value);
                                    setPaletteBrowserOpen(false);
                                  }}
                                  title={`${tokenPath} (${value})`}
                                >
                                  <span
                                    className={classes.paletteShadeChip}
                                    style={{ background: value }}
                                  />
                                  <span className={classes.paletteShadeLabel}>{step}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredPaletteNames.length === 0 && (
                      <Text size="sm" tone="secondary">
                        No palette colors match that search.
                      </Text>
                    )}
                  </Stack>
                </Dialog.Popup>
              </Dialog.Backdrop>
            </Dialog.Root>
          </>
        ) : (
          <>
            <SegmentedControl
              size="sm"
              selectedKeys={new Set([isReference ? "reference" : "direct"])}
              onSelectionChange={(keys) => {
                const value = [...keys][0];
                if (value === "direct" && isReference) {
                  onChange(entry, defaultDirectValue(entry.type));
                  return;
                }
                if (value === "reference" && !isReference && referenceFallback) {
                  onChange(entry, referenceFallback);
                }
              }}
              options={[
                { id: "direct", label: "Direct" },
                { id: "reference", label: "Reference" },
              ]}
              style={{ width: "100%" }}
            />
            {!isReference ? (
              <TextField
                label={typeLabel}
                size="sm"
                value={entry.value}
                onChange={(value) => onChange(entry, value)}
                placeholder={entry.type === "fontFamily" ? "'Outfit', sans-serif" : "12px"}
              />
            ) : (
              <Typeahead
                label={`Reference ${typeLabel.toLowerCase()}`}
                options={references.map((option) => ({ id: option.value, label: option.label }))}
                selectedKey={referenceValue}
                onSelectionChange={(key) => key != null && onChange(entry, String(key))}
                placeholder="Reference another token"
              />
            )}
          </>
        )}
      </Stack>
    </Surface>
  );
}

export function ThemeEditor({
  documents,
  activeThemeDocumentId,
  previewViews = [],
  initialPreviewViewId,
  onChange,
}: ThemeEditorProps): JSX.Element {
  const themeDocuments = useMemo(() => documents ?? [], [documents]);
  const initialThemeId = useMemo(
    () => getInitialThemeId(themeDocuments, activeThemeDocumentId),
    [activeThemeDocumentId, themeDocuments],
  );

  /** Row highlight in the library (which theme actions apply to). */
  const [libraryFocusId, setLibraryFocusId] = useState<string | null>(initialThemeId);
  /** When set, the JSON + preview workspace is open for this theme id. */
  const [editingThemeId, setEditingThemeId] = useState<string | null>(initialThemeId);

  const [editorValue, setEditorValue] = useState("");
  const [themeName, setThemeName] = useState("Custom Theme");
  const [presetId, setPresetId] = useState<string>(THEME_PRESET_OPTIONS[0]?.value ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [libraryNotice, setLibraryNotice] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<ColorMode>("dark");
  const [editorTab, setEditorTab] = useState<string | null>("quick");
  const [widgetTokenQuery, setWidgetTokenQuery] = useState("");
  const [previewViewId, setPreviewViewId] = useState<string | null>(
    initialPreviewViewId ?? previewViews[0]?.id ?? null,
  );

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<Element | undefined>(undefined);

  useEffect(() => {
    setPortalContainer(rootRef.current ?? undefined);
  }, []);

  const editingTheme = useMemo(
    () =>
      editingThemeId ? (themeDocuments.find((doc) => doc.id === editingThemeId) ?? null) : null,
    [themeDocuments, editingThemeId],
  );

  const savedJsonForEditing = useMemo(() => {
    if (!editingTheme) return "";
    return JSON.stringify(editingTheme, null, 2);
  }, [editingTheme]);

  const isDirty = Boolean(editingThemeId && editorValue !== savedJsonForEditing);

  useEffect(() => {
    if (!libraryFocusId && initialThemeId) {
      setLibraryFocusId(initialThemeId);
      if (!editingThemeId) setEditingThemeId(initialThemeId);
      return;
    }
    if (libraryFocusId && !themeDocuments.some((doc) => doc.id === libraryFocusId)) {
      setLibraryFocusId(initialThemeId);
      if (!editingThemeId) setEditingThemeId(initialThemeId);
    }
  }, [editingThemeId, initialThemeId, libraryFocusId, themeDocuments]);

  useEffect(() => {
    if (previewViewId && previewViews.some((view) => view.id === previewViewId)) {
      return;
    }
    setPreviewViewId(initialPreviewViewId ?? previewViews[0]?.id ?? null);
  }, [initialPreviewViewId, previewViewId, previewViews]);

  /** Load editor when entering edit mode for a theme. */
  useEffect(() => {
    if (!editingThemeId) {
      setEditorValue("");
      return;
    }
    const doc = themeDocuments.find((d) => d.id === editingThemeId);
    if (doc) {
      setEditorValue(JSON.stringify(doc, null, 2));
    }
  }, [editingThemeId]); // oxlint-disable-line react-hooks/exhaustive-deps -- only reset buffer when switching edit target

  const previewResult = useMemo(() => {
    if (!editingThemeId || !editorValue.trim()) {
      return { status: "empty" as const };
    }
    try {
      const parsed: unknown = JSON.parse(editorValue);
      const validation = validateThemeDocument(parsed);
      if (!validation.ok || !validation.data) {
        return { status: "invalid" as const, issues: validation.issues };
      }
      return { status: "ok" as const, doc: validation.data };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { status: "parse" as const };
      }
      return {
        status: "invalid" as const,
        issues: [
          {
            path: "$",
            message: error instanceof Error ? error.message : "Unable to resolve theme.",
          },
        ],
      };
    }
  }, [editorValue, editingThemeId]);

  const editableTokenEntries = useMemo(
    () =>
      previewResult.status === "ok" ? getEditableTokenEntries(previewResult.doc, previewMode) : [],
    [previewMode, previewResult],
  );

  const widgetTokenSections = useMemo(
    () => getWidgetTokenSections(editableTokenEntries, widgetTokenQuery),
    [editableTokenEntries, widgetTokenQuery],
  );

  const groupedTokenEntries = useMemo(() => {
    const groups = new Map<EditableTokenType, EditableTokenEntry[]>();
    for (const entry of editableTokenEntries) {
      const groupName = entry.type;
      groups.set(groupName, [...(groups.get(groupName) ?? []), entry]);
    }
    return Array.from(groups.entries());
  }, [editableTokenEntries]);

  const referenceOptionsByType = useMemo(
    () => ({
      color:
        previewResult.status === "ok"
          ? buildReferenceOptions(previewResult.doc, previewMode, "color")
          : [],
      fontFamily:
        previewResult.status === "ok"
          ? buildReferenceOptions(previewResult.doc, previewMode, "fontFamily")
          : [],
      dimension:
        previewResult.status === "ok"
          ? buildReferenceOptions(previewResult.doc, previewMode, "dimension")
          : [],
    }),
    [previewMode, previewResult],
  );

  const activePreviewView =
    previewViews.find((view) => view.id === previewViewId) ?? previewViews[0] ?? null;

  const updateToken = (entry: EditableTokenEntry, value: string) => {
    if (previewResult.status !== "ok") return;
    const nextDoc = setTokenValue(previewResult.doc, entry.tokenPath, value, entry.type);
    setEditorValue(JSON.stringify(nextDoc, null, 2));
    setSaveError(null);
    setSaveSuccess(null);
  };

  const referencesFor = (entry: EditableTokenEntry) =>
    referenceOptionsByType[entry.type].filter(
      (option) => option.value !== `{${entry.referencePath}}`,
    );

  const beginEdit = (id: string) => {
    if (isDirty) {
      setPendingEditId(id);
      setDiscardOpen(true);
      return;
    }
    setEditingThemeId(id);
    setLibraryFocusId(id);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const confirmDiscardAndSwitch = () => {
    const next = pendingEditId;
    setDiscardOpen(false);
    setPendingEditId(null);
    if (next) {
      setEditingThemeId(next);
      setLibraryFocusId(next);
      setSaveError(null);
      setSaveSuccess(null);
    }
  };

  const closeEditor = () => {
    if (isDirty) {
      setPendingEditId(null);
      setDiscardOpen(true);
      return;
    }
    setEditingThemeId(null);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleDiscardClose = () => {
    setDiscardOpen(false);
    if (pendingEditId) {
      confirmDiscardAndSwitch();
      return;
    }
    setEditingThemeId(null);
    setSaveError(null);
    setSaveSuccess(null);
    setPendingEditId(null);
  };

  const createNewTheme = () => {
    const rawDoc = createThemeDocumentFromPreset(presetId, themeName);
    const ids = new Set(themeDocuments.map((doc) => doc.id));
    const id = uniqueId(rawDoc.id, ids);
    const now = new Date().toISOString();
    const nextDoc: ThemeDocument = {
      ...rawDoc,
      id,
      updatedAt: now,
      createdAt: rawDoc.createdAt ?? now,
    };
    const nextDocs = withActiveFlags([...themeDocuments, nextDoc], id);

    onChange(nextDocs, id);
    setLibraryFocusId(id);
    setLibraryNotice(`Created "${nextDoc.name}".`);
    setEditingThemeId(id);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const saveJson = () => {
    if (!editingThemeId) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(editorValue);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Invalid JSON.");
      setSaveSuccess(null);
      return;
    }

    const validation = validateThemeDocument(parsed);
    if (!validation.ok) {
      setSaveError(`Theme JSON failed validation:\n${formatIssues(validation.issues)}`);
      setSaveSuccess(null);
      return;
    }

    const now = new Date().toISOString();
    const incoming = parsed as ThemeDocument;
    const normalizedDoc: ThemeDocument = {
      ...incoming,
      id: editingThemeId,
      updatedAt: now,
      createdAt: editingTheme?.createdAt ?? incoming.createdAt ?? now,
      isActive: editingThemeId === (activeThemeDocumentId ?? editingThemeId),
    };

    const nextDocs = themeDocuments.map((doc) => (doc.id === editingThemeId ? normalizedDoc : doc));
    const nextActiveId = activeThemeDocumentId ?? editingThemeId;

    onChange(withActiveFlags(nextDocs, nextActiveId), nextActiveId);
    setEditorValue(JSON.stringify(normalizedDoc, null, 2));
    setSaveError(null);
    setSaveSuccess(`Saved "${normalizedDoc.name}".`);
  };

  const activateTheme = (id: string) => {
    const nextDocs = withActiveFlags(themeDocuments, id);
    onChange(nextDocs, id);
    setLibraryNotice(`"${themeDocuments.find((d) => d.id === id)?.name ?? id}" is now active.`);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    const next = themeDocuments.filter((d) => d.id !== id);
    let nextActive = activeThemeDocumentId ?? null;
    if (activeThemeDocumentId === id) {
      nextActive = next[0]?.id ?? null;
    }
    if (editingThemeId === id) {
      setEditingThemeId(null);
      setEditorValue("");
      setSaveError(null);
      setSaveSuccess(null);
    }
    if (libraryFocusId === id) {
      setLibraryFocusId(next[0]?.id ?? null);
    }
    onChange(withActiveFlags(next, nextActive), nextActive);
    setDeleteTargetId(null);
    setLibraryNotice("Theme deleted.");
  };

  const focusedTheme = themeDocuments.find((d) => d.id === libraryFocusId);

  return (
    <OverlayPortalContext.Provider value={portalContainer}>
      <div ref={rootRef} className={classes.page}>
        {libraryNotice && (
          <Alert variant="info" appearance="subtle">
            <HStack justify="between" align="start" gap="sm">
              <Text size="sm">{libraryNotice}</Text>
              <IconButton
                name="close"
                aria-label="Dismiss notice"
                appearance="ghost"
                size="sm"
                onPress={() => setLibraryNotice(null)}
              />
            </HStack>
          </Alert>
        )}

        <div className={classes.mainLayout}>
          <Surface padding="md" className={classes.library}>
            <Stack gap="md" style={{ height: "100%", minHeight: 0 }}>
              <HStack justify="between">
                <Text weight="semibold">Theme library</Text>
                <Badge appearance="subtle">{themeDocuments.length} saved</Badge>
              </HStack>

              <ScrollArea className={classes.libraryScroll}>
                <Stack gap="xs">
                  {themeDocuments.length === 0 ? (
                    <Text size="sm" tone="secondary">
                      No themes yet. Create one below.
                    </Text>
                  ) : (
                    themeDocuments.map((doc) => {
                      const isFocus = libraryFocusId === doc.id;
                      const isLive = activeThemeDocumentId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className={`${classes.themeRow} ${isFocus ? classes.themeRowSelected : ""} ${isLive ? classes.themeRowActive : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => beginEdit(doc.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              beginEdit(doc.id);
                            }
                          }}
                        >
                          <div className={classes.themeRowHeader}>
                            <Text size="sm" weight="semibold" lineClamp={2}>
                              {doc.name}
                            </Text>
                            {isLive && (
                              <Badge tone="success" appearance="solid">
                                Active
                              </Badge>
                            )}
                          </div>
                          <Text className={classes.themeRowMeta} lineClamp={1}>
                            {doc.id}
                          </Text>
                          <div className={classes.themeRowActions}>
                            <SimpleTooltip
                              content="Edit JSON & preview"
                              portalContainer={portalContainer}
                            >
                              <IconButton
                                name="wrench"
                                icon={<IconEdit size={14} />}
                                appearance="subtle"
                                tone="accent"
                                size="sm"
                                aria-label="Edit JSON & preview"
                                onPress={() => beginEdit(doc.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </SimpleTooltip>
                            <SimpleTooltip
                              content="Set as active theme"
                              portalContainer={portalContainer}
                            >
                              <IconButton
                                name="check"
                                icon={<IconCheck size={14} />}
                                appearance="subtle"
                                tone="success"
                                size="sm"
                                aria-label="Set as active theme"
                                isDisabled={isLive}
                                onPress={() => activateTheme(doc.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </SimpleTooltip>
                            <SimpleTooltip content="Delete theme" portalContainer={portalContainer}>
                              <IconButton
                                name="close"
                                icon={<IconTrash size={14} />}
                                appearance="subtle"
                                tone="danger"
                                size="sm"
                                aria-label="Delete theme"
                                onPress={() => setDeleteTargetId(doc.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </SimpleTooltip>
                          </div>
                        </div>
                      );
                    })
                  )}
                </Stack>
              </ScrollArea>

              <Stack
                gap="sm"
                style={{
                  borderTop: "1px solid var(--var-ui-color-border-default)",
                  paddingTop: "0.75rem",
                }}
              >
                <Text
                  size="xs"
                  weight="semibold"
                  tone="secondary"
                  style={{ textTransform: "uppercase" }}
                >
                  New theme
                </Text>
                <TextField
                  label="Name"
                  size="sm"
                  value={themeName}
                  onChange={setThemeName}
                  placeholder="My theme"
                />
                <Select
                  label="From preset"
                  options={PRESET_SELECT_OPTIONS}
                  selectedKey={presetId}
                  onSelectionChange={(key) => key != null && setPresetId(String(key))}
                  portalContainer={portalContainer}
                />
                <Button size="sm" onPress={createNewTheme} isDisabled={!themeName.trim()}>
                  <IconPlus size={14} />
                  Create theme
                </Button>
              </Stack>
            </Stack>
          </Surface>

          <Surface padding="md" className={classes.workspace}>
            {!editingThemeId ? (
              <div className={classes.workspaceEmpty}>
                <Stack gap="sm" align="center" style={{ maxWidth: 360 }}>
                  <Text weight="semibold" style={{ textAlign: "center" }}>
                    Edit workspace
                  </Text>
                  <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
                    Choose a theme in the library and click the pencil to edit its JSON and see a
                    live preview. Active theme is used when you save config; use the checkmark in
                    the library to switch which one is active.
                  </Text>
                  {focusedTheme && (
                    <Button appearance="subtle" onPress={() => beginEdit(focusedTheme.id)}>
                      <IconEdit size={16} />
                      Edit &quot;{focusedTheme.name}&quot;
                    </Button>
                  )}
                </Stack>
              </div>
            ) : (
              <Stack gap="md" className={classes.workspaceBody}>
                <HStack justify="between" align="start" wrap className={classes.workspaceHeader}>
                  <div>
                    <Text weight="semibold">Editing</Text>
                    <Text size="sm" tone="secondary" as="div">
                      {editingTheme?.name ?? editingThemeId}
                      {isDirty ? (
                        <Badge
                          tone="warning"
                          appearance="subtle"
                          style={{ marginInlineStart: "0.5rem" }}
                        >
                          Unsaved
                        </Badge>
                      ) : null}
                    </Text>
                  </div>
                  <HStack gap="xs">
                    <Button appearance="outline" size="sm" onPress={closeEditor}>
                      <IconX size={16} />
                      Close
                    </Button>
                    <Button size="sm" onPress={saveJson}>
                      Save JSON
                    </Button>
                  </HStack>
                </HStack>

                <div className={classes.editorPreviewRow}>
                  <div className={classes.editorColumn}>
                    <Stack gap="sm">
                      <Tabs
                        className={classes.editorTabsList}
                        selectedKey={editorTab ?? "quick"}
                        onSelectionChange={(key: Key) => setEditorTab(String(key))}
                        tabs={[
                          {
                            id: "quick",
                            label: "Widget tokens",
                            content:
                              previewResult.status === "ok" ? (
                                <Stack gap="sm">
                                  <div className={classes.widgetTokenIntro}>
                                    <TextField
                                      size="sm"
                                      label="Filter widget tokens"
                                      placeholder="Search token, CSS variable, or value"
                                      value={widgetTokenQuery}
                                      onChange={setWidgetTokenQuery}
                                      className={classes.widgetTokenSearch}
                                    />
                                  </div>

                                  {widgetTokenSections.length === 0 ? (
                                    <Surface padding="md">
                                      <Text size="sm" tone="secondary">
                                        No widget-related tokens match this filter.
                                      </Text>
                                    </Surface>
                                  ) : (
                                    <Stack gap="md">
                                      {widgetTokenSections.map((section) => (
                                        <section key={section.id} className={classes.tokenSection}>
                                          <HStack justify="between" gap="xs" align="start">
                                            <div>
                                              <Text
                                                size="xs"
                                                weight="semibold"
                                                tone="secondary"
                                                style={{ textTransform: "uppercase" }}
                                              >
                                                {section.title}
                                              </Text>
                                              <Text size="xs" tone="secondary">
                                                {section.description}
                                              </Text>
                                            </div>
                                            <Badge appearance="outline">
                                              {section.entries.length} tokens
                                            </Badge>
                                          </HStack>
                                          <div className={classes.colorTokenGrid}>
                                            {section.entries.map((entry) => (
                                              <TokenControl
                                                key={entry.referencePath}
                                                entry={entry}
                                                references={referencesFor(entry)}
                                                onChange={updateToken}
                                              />
                                            ))}
                                          </div>
                                        </section>
                                      ))}
                                    </Stack>
                                  )}
                                </Stack>
                              ) : (
                                <Alert variant="warning">
                                  Fix the theme JSON before editing tokens in the GUI.
                                </Alert>
                              ),
                          },
                          {
                            id: "all",
                            label: "All tokens",
                            content:
                              previewResult.status === "ok" ? (
                                <Stack gap="md">
                                  {groupedTokenEntries.map(([groupName, entries]) => (
                                    <Stack gap="sm" key={groupName}>
                                      <Text
                                        size="xs"
                                        weight="semibold"
                                        tone="secondary"
                                        style={{ textTransform: "uppercase" }}
                                      >
                                        {tokenTypeLabel(groupName)}
                                      </Text>
                                      <div className={classes.colorTokenGrid}>
                                        {entries.map((entry) => (
                                          <TokenControl
                                            key={entry.referencePath}
                                            entry={entry}
                                            references={referencesFor(entry)}
                                            onChange={updateToken}
                                          />
                                        ))}
                                      </div>
                                    </Stack>
                                  ))}
                                </Stack>
                              ) : (
                                <Alert variant="warning">
                                  Fix the theme JSON before editing tokens in the GUI.
                                </Alert>
                              ),
                          },
                          {
                            id: "json",
                            label: "Theme JSON",
                            content: (
                              <TextAreaField
                                label="Theme JSON"
                                className={classes.textarea}
                                value={editorValue}
                                onChange={setEditorValue}
                              />
                            ),
                          },
                        ]}
                      />

                      {saveError && (
                        <Alert variant="danger" icon={<IconAlertCircle size={16} />}>
                          <Text size="sm" as="div" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                            {saveError}
                          </Text>
                        </Alert>
                      )}
                      {saveSuccess && (
                        <Alert variant="success">
                          <Text size="sm">{saveSuccess}</Text>
                        </Alert>
                      )}

                      <Text size="xs" tone="secondary">
                        Validation matches{" "}
                        <Code>packages/schema/schemas/theme-document.schema.json</Code>.
                      </Text>
                    </Stack>
                  </div>

                  <div className={classes.previewColumn}>
                    <Stack gap="sm">
                      <HStack justify="between" align="center" wrap>
                        <Text size="sm" weight="semibold">
                          View preview
                        </Text>
                        <HStack gap="xs">
                          {previewViews.length > 0 && (
                            <Select
                              aria-label="Preview view"
                              options={previewViews.map((view) => ({
                                id: view.id,
                                label: view.name,
                              }))}
                              selectedKey={activePreviewView?.id ?? null}
                              onSelectionChange={(key) =>
                                setPreviewViewId(key == null ? null : String(key))
                              }
                              className={classes.previewViewSelect}
                              portalContainer={portalContainer}
                            />
                          )}
                          <SegmentedControl
                            size="sm"
                            selectedKeys={new Set([previewMode])}
                            onSelectionChange={(keys) => {
                              const value = [...keys][0];
                              if (value === "dark" || value === "light") setPreviewMode(value);
                            }}
                            options={[
                              { id: "dark", label: "Dark" },
                              { id: "light", label: "Light" },
                            ]}
                          />
                        </HStack>
                      </HStack>

                      <div className={classes.previewShell}>
                        {previewResult.status === "ok" ? (
                          <ThemePreviewIsland
                            doc={previewResult.doc}
                            colorMode={previewMode}
                            view={activePreviewView}
                          />
                        ) : (
                          <div className={classes.previewPlaceholder}>
                            {previewResult.status === "empty" && "Edit JSON to see a preview."}
                            {previewResult.status === "parse" &&
                              "Fix JSON syntax to preview this theme."}
                            {previewResult.status === "invalid" && (
                              <Stack gap="xs" align="center">
                                <Text size="sm" weight="medium">
                                  Preview needs a valid theme document
                                </Text>
                                <Text
                                  size="xs"
                                  tone="secondary"
                                  style={{ textAlign: "center", maxWidth: 280 }}
                                >
                                  {formatIssues(previewResult.issues)}
                                </Text>
                              </Stack>
                            )}
                          </div>
                        )}
                      </div>
                    </Stack>
                  </div>
                </div>
              </Stack>
            )}
          </Surface>
        </div>

        <Dialog.Root
          isOpen={Boolean(deleteTargetId)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setDeleteTargetId(null);
          }}
          portalContainer={portalContainer}
        >
          <Dialog.Backdrop>
            <Dialog.Popup>
              <Dialog.Title>Delete theme?</Dialog.Title>
              <Text size="sm">
                This removes the theme from this display&apos;s library. This cannot be undone.
              </Text>
              <Dialog.Actions>
                <Button appearance="outline" onPress={() => setDeleteTargetId(null)}>
                  Cancel
                </Button>
                <Button tone="danger" onPress={confirmDelete}>
                  Delete
                </Button>
              </Dialog.Actions>
            </Dialog.Popup>
          </Dialog.Backdrop>
        </Dialog.Root>

        <Dialog.Root
          isOpen={discardOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDiscardOpen(false);
              setPendingEditId(null);
            }
          }}
          portalContainer={portalContainer}
        >
          <Dialog.Backdrop>
            <Dialog.Popup>
              <Dialog.Title>Discard unsaved changes?</Dialog.Title>
              <Text size="sm">
                {pendingEditId
                  ? "Save or discard your edits before opening another theme."
                  : "You have unsaved edits. Close the editor and discard them?"}
              </Text>
              <Dialog.Actions>
                <Button
                  appearance="outline"
                  onPress={() => {
                    setDiscardOpen(false);
                    setPendingEditId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button tone="warning" onPress={handleDiscardClose}>
                  Discard
                </Button>
              </Dialog.Actions>
            </Dialog.Popup>
          </Dialog.Backdrop>
        </Dialog.Root>
      </div>
    </OverlayPortalContext.Provider>
  );
}

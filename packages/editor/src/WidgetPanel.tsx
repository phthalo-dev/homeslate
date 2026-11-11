import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import {
  Alert,
  Button,
  HStack,
  IconButton,
  Link,
  ProgressBar,
  Select,
  Grid,
  Tooltip,
  Slider,
  Spinner,
  Stack,
  Tabs,
  Text,
  TextField,
} from "@var-ui/react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconUpload,
  IconPhoto,
  IconBrandGoogle,
  IconPlus,
  IconTrash,
  IconExternalLink,
} from "@tabler/icons-react";
import { v4 as uuidv4 } from "uuid";
import {
  getWidgetTypes,
  useGooglePhotos,
  loadStoredImage,
  useGoogleRuntime,
} from "@homeslate/widgets";
import type { Photo, StoredPhoto } from "@homeslate/widgets";
import type { DisplayDocument, View, ViewBackground, WidgetInstance } from "@homeslate/schema";
import {
  addWidget,
  findAvailablePosition,
  type WidgetRegistryApi,
} from "@homeslate/display/canvas";
import * as classes from "./WidgetPanel.styles";

type UploadBackgroundPhoto = (payload: {
  dataUrl?: string;
  url?: string;
  filename?: string;
}) => Promise<{ key: string; filename: string }>;

const INTERVAL_PRESETS = [
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
  { value: 300, label: "5m" },
];
const INTERVAL_PRESET_VALUES = INTERVAL_PRESETS.map((p) => p.value);

const IMAGE_SIZE_OPTIONS = [
  { value: "cover", label: "Cover (fill screen)" },
  { value: "contain", label: "Contain (fit inside)" },
  { value: "tile", label: "Tile (repeat)" },
];

function asPhotos(value: unknown[] | undefined): Photo[] {
  if (!value) return [];
  return value.filter((photo): photo is Photo => {
    if (typeof photo !== "object" || photo === null || !("type" in photo)) return false;
    const typed = photo as { type?: unknown; url?: unknown; key?: unknown };
    if (typed.type === "url") return typeof typed.url === "string";
    if (typed.type === "stored") return typeof typed.key === "string";
    return false;
  });
}

interface BgThumbGridProps {
  photos: Photo[];
  onRemove: (index: number) => void;
}

function BgThumbGrid({ photos, onRemove }: BgThumbGridProps) {
  const [thumbUrls, setThumbUrls] = useState<Map<string, string>>(new Map());
  const blobUrlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const map = new Map<string, string>();
      await Promise.all(
        photos.map(async (photo) => {
          if (photo.type === "url") {
            map.set(photo.url, photo.url);
          } else {
            const cached = blobUrlsRef.current.get(photo.key);
            if (cached) {
              map.set(photo.key, cached);
              return;
            }
            try {
              const blobUrl = await loadStoredImage(photo.key);
              if (!cancelled) blobUrlsRef.current.set(photo.key, blobUrl);
              map.set(photo.key, blobUrl);
            } catch {
              /* skip */
            }
          }
        }),
      );
      if (!cancelled) setThumbUrls(map);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [photos]);

  useEffect(() => {
    const blobUrls = blobUrlsRef.current;
    return () => {
      blobUrls.forEach((u) => URL.revokeObjectURL(u));
      blobUrls.clear();
    };
  }, []);

  if (photos.length === 0) return null;

  return (
    <Grid columns={3} gap="xs">
      {photos.map((photo, index) => {
        const id = photo.type === "url" ? photo.url : photo.key;
        const src = thumbUrls.get(id);
        return (
          <div
            key={index}
            style={{ position: "relative", borderRadius: 4, overflow: "hidden", height: 52 }}
          >
            {src ? (
              <img src={src} alt="" style={{ width: "100%", height: 52, objectFit: "cover" }} />
            ) : (
              <div
                style={{
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--var-ui-color-border-default)",
                }}
              >
                <Spinner size="sm" label="Loading thumbnail" />
              </div>
            )}
            <IconButton
              icon={<IconX size={8} />}
              aria-label="Remove photo"
              size="sm"
              tone="danger"
              appearance="filled"
              onClick={() => onRemove(index)}
              style={{ position: "absolute", top: 2, right: 2, opacity: 0.85 }}
            />
          </div>
        );
      })}
    </Grid>
  );
}

export function BgSettings(props: {
  view: View;
  updateBg: (patch: Partial<ViewBackground>) => void;
  onUploadBackgroundPhoto?: UploadBackgroundPhoto;
}): JSX.Element {
  const { view, updateBg, onUploadBackgroundPhoto } = props;
  const photos: Photo[] = useMemo(
    () => asPhotos(view.background?.photos),
    [view.background?.photos],
  );
  const interval = view.background?.intervalSeconds ?? 10;
  const overlay = view.background?.overlayOpacity ?? 0.5;
  const image = view.background?.image;
  const imageSize = view.background?.imageSize ?? "cover";

  const [newUrl, setNewUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlUploading, setUrlUploading] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated, isLoading: authLoading, signIn } = useGoogleRuntime();
  const {
    pickerStatus,
    uploadProgress,
    error: googleError,
    pickerUri,
    storedImages,
    startPicker,
    clearSelection: clearGoogleSelection,
  } = useGooglePhotos({ savedImages: [] });

  const savedGoogleRef = useRef(false);
  useEffect(() => {
    if (pickerStatus === "ready" && storedImages.length > 0 && !savedGoogleRef.current) {
      savedGoogleRef.current = true;
      const newPhotos: StoredPhoto[] = storedImages.map((img) => ({
        type: "stored",
        key: img.key,
        filename: img.filename,
      }));
      const existingKeys = new Set(
        photos.filter((p): p is StoredPhoto => p.type === "stored").map((p) => p.key),
      );
      const toAdd = newPhotos.filter((p) => !existingKeys.has(p.key));
      if (toAdd.length > 0) updateBg({ photos: [...photos, ...toAdd] });
    }
    if (pickerStatus === "idle") savedGoogleRef.current = false;
  }, [pickerStatus, storedImages, photos, updateBg]);

  const removePhoto = (index: number) => {
    updateBg({ photos: photos.filter((_, i) => i !== index) });
  };

  const addUrlPhoto = async () => {
    if (!newUrl.trim()) return;
    setUrlError(null);
    if (!onUploadBackgroundPhoto) {
      setUrlError("Photo upload is unavailable");
      return;
    }
    setUrlUploading(true);
    try {
      const { key, filename } = await onUploadBackgroundPhoto({
        url: newUrl.trim(),
        filename: newUrl.split("/").pop(),
      });
      updateBg({ photos: [...photos, { type: "stored", key, filename } as StoredPhoto] });
      setNewUrl("");
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Failed to add photo");
    } finally {
      setUrlUploading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !onUploadBackgroundPhoto) return;
    setUploadError(null);
    setUploading(true);
    const newPhotos: StoredPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setUploadError(`"${file.name}" is not an image`);
        continue;
      }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
        const { key, filename } = await onUploadBackgroundPhoto({ dataUrl, filename: file.name });
        newPhotos.push({ type: "stored", key, filename });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : `Failed to upload "${file.name}"`);
      }
    }
    if (newPhotos.length > 0) updateBg({ photos: [...photos, ...newPhotos] });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasBackground = photos.length > 0 || !!image;

  const addPhotoTabs = [
    {
      value: "url",
      label: "URL",
      content: (
        <Stack gap="xs">
          <HStack gap="xs">
            <TextField
              aria-label="Photo URL"
              style={{ flex: 1 }}
              size="sm"
              placeholder="https://example.com/photo.jpg"
              value={newUrl}
              onValueChange={setNewUrl}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addUrlPhoto();
              }}
            />
            <Button
              size="sm"
              appearance="outline"
              disabled={!newUrl.trim()}
              loading={urlUploading}
              onClick={() => void addUrlPhoto()}
            >
              <IconPlus size={12} />
              Add
            </Button>
          </HStack>
          {urlError && (
            <Alert tone="danger" appearance="subtle">
              <Text size="xs">{urlError}</Text>
            </Alert>
          )}
        </Stack>
      ),
    },
    ...(onUploadBackgroundPhoto
      ? [
          {
            value: "upload",
            label: "Device",
            content: (
              <Stack gap="xs">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => void handleFileUpload(e.currentTarget.files)}
                />
                <Button
                  size="sm"
                  appearance="outline"
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: "100%" }}
                >
                  <IconUpload size={12} />
                  {uploading ? "Uploading…" : "Choose from Device"}
                </Button>
                {uploadError && (
                  <Alert tone="danger" appearance="subtle">
                    <Text size="xs">{uploadError}</Text>
                  </Alert>
                )}
                <Text size="xs" tone="secondary">
                  JPEG, PNG, GIF, WebP — max 20 MB
                </Text>
              </Stack>
            ),
          },
        ]
      : []),
    {
      value: "google",
      label: "Google",
      content: (
        <Stack gap="xs">
          {!isAuthenticated ? (
            <>
              <Text size="xs" tone="secondary">
                Sign in to pick from Google Photos
              </Text>
              <Button size="sm" loading={authLoading} onClick={signIn}>
                <IconBrandGoogle size={12} />
                Sign in with Google
              </Button>
            </>
          ) : (
            <>
              <Text size="xs" tone="secondary">
                Connected to Google
              </Text>
              {pickerStatus === "pending" && pickerUri && (
                <Stack gap="xs">
                  <Text size="xs" tone="secondary">
                    Select photos, then come back here.
                  </Text>
                  <Link href={pickerUri} target="_blank">
                    Open Google Photos <IconExternalLink size={10} />
                  </Link>
                </Stack>
              )}
              {pickerStatus === "uploading" && uploadProgress && (
                <Stack gap="xs">
                  <Text size="xs" tone="secondary">
                    Saving… {uploadProgress.done}/{uploadProgress.total}
                  </Text>
                  <ProgressBar value={(uploadProgress.done / uploadProgress.total) * 100} />
                </Stack>
              )}
              {googleError && (
                <Alert tone="danger" appearance="subtle">
                  <Text size="xs">{googleError}</Text>
                </Alert>
              )}
              <HStack gap="xs">
                <Button
                  size="sm"
                  loading={pickerStatus === "pending" || pickerStatus === "uploading"}
                  disabled={pickerStatus === "pending" || pickerStatus === "uploading"}
                  onClick={() => void startPicker()}
                >
                  <IconPhoto size={12} />
                  Pick Photos
                </Button>
                {storedImages.length > 0 && (
                  <Button size="sm" appearance="ghost" tone="danger" onClick={clearGoogleSelection}>
                    Cancel
                  </Button>
                )}
              </HStack>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Stack gap="xs">
      {photos.length > 0 && <BgThumbGrid photos={photos} onRemove={removePhoto} />}

      {photos.length === 0 && image && (
        <div style={{ position: "relative", borderRadius: 6, overflow: "hidden", height: 64 }}>
          <img
            src={image}
            alt="Background preview"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <IconButton
            icon={<IconX size={12} />}
            aria-label="Remove background image"
            size="sm"
            appearance="filled"
            tone="danger"
            onClick={() => updateBg({ image: undefined })}
            style={{ position: "absolute", top: 4, right: 4 }}
          />
        </div>
      )}

      <Tabs defaultValue="url" tabs={addPhotoTabs} />

      {photos.length > 1 && (
        <Stack gap="xs">
          <Text size="xs" tone="secondary">
            Slideshow interval
          </Text>
          <HStack gap="xs" wrap>
            {INTERVAL_PRESETS.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                appearance={interval === value ? "filled" : "outline"}
                onClick={() => updateBg({ intervalSeconds: value })}
              >
                {label}
              </Button>
            ))}
            <Button
              size="sm"
              appearance={!INTERVAL_PRESET_VALUES.includes(interval) ? "filled" : "outline"}
              onClick={() => {
                if (INTERVAL_PRESET_VALUES.includes(interval)) updateBg({ intervalSeconds: 20 });
              }}
            >
              Custom
            </Button>
          </HStack>
          {!INTERVAL_PRESET_VALUES.includes(interval) && (
            <TextField
              size="sm"
              aria-label="Custom interval seconds"
              placeholder="Seconds"
              value={String(interval)}
              onValueChange={(value) => {
                const num = parseInt(value, 10);
                if (!isNaN(num) && num >= 3) updateBg({ intervalSeconds: num });
              }}
              style={{ width: 100 }}
            />
          )}
        </Stack>
      )}

      {hasBackground && (
        <>
          <Select
            aria-label="Image size"
            options={IMAGE_SIZE_OPTIONS}
            value={imageSize}
            onValueChange={(key) => {
              if (key === "cover" || key === "contain" || key === "tile") {
                updateBg({ imageSize: key });
              }
            }}
          />
          <Stack gap="xs">
            <HStack justify="between">
              <Text size="xs" tone="secondary">
                Overlay darkness
              </Text>
              <Text size="xs" tone="secondary">
                {Math.round(overlay * 100)}%
              </Text>
            </HStack>
            <Slider
              aria-label="Overlay darkness"
              value={overlay * 100}
              onValueChange={(v) =>
                updateBg({ overlayOpacity: (typeof v === "number" ? v : (v[0] ?? 0)) / 100 })
              }
              min={0}
              max={90}
              step={5}
              showOutput={false}
            />
          </Stack>
        </>
      )}

      {photos.length > 0 && (
        <Button size="sm" appearance="ghost" tone="danger" onClick={() => updateBg({ photos: [] })}>
          <IconTrash size={12} />
          Remove All
        </Button>
      )}
    </Stack>
  );
}

export function WidgetPanel(props: {
  document: DisplayDocument;
  viewId: string;
  onChange?: (next: DisplayDocument) => void;
  widgetRegistry?: WidgetRegistryApi;
}): JSX.Element {
  const { document, viewId, onChange, widgetRegistry } = props;
  const [collapsed, setCollapsed] = useState(false);
  const documentRef = useRef(document);
  // eslint-disable-next-line react-hooks/refs -- keeps the ref current for edits that land in the same tick
  documentRef.current = document;
  const widgetTypes = (widgetRegistry?.getWidgetTypes ?? getWidgetTypes)();

  const handleAddWidget = (type: string) => {
    const widgetDef = widgetTypes.find((w) => w.type === type);
    if (!widgetDef) return;
    const view = documentRef.current.views.find((item) => item.id === viewId);
    const pos = findAvailablePosition(
      view?.widgets ?? [],
      view?.columns ?? 12,
      widgetDef.defaultLayout.w,
      widgetDef.defaultLayout.h,
    );
    const widget: WidgetInstance = {
      id: uuidv4(),
      type,
      title: widgetDef.name,
      config: { ...widgetDef.defaultConfig },
      layout: {
        x: pos.x,
        y: pos.y,
        w: widgetDef.defaultLayout.w,
        h: widgetDef.defaultLayout.h,
        minW: widgetDef.defaultLayout.minW,
        minH: widgetDef.defaultLayout.minH,
        maxW: widgetDef.defaultLayout.maxW,
        maxH: widgetDef.defaultLayout.maxH,
      },
    };
    const next = addWidget(documentRef.current, viewId, widget);
    documentRef.current = next;
    onChange?.(next);
  };

  return (
    <aside className={`${classes.panel} ${collapsed ? classes.collapsed : ""}`}>
      <div className={classes.toggleBar}>
        <IconButton
          icon={collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
          appearance="ghost"
          onClick={() => setCollapsed((c) => !c)}
          className={classes.toggleBtn}
          aria-label={collapsed ? "Expand widget panel" : "Collapse widget panel"}
        />
      </div>

      {collapsed ? (
        <Stack gap="xs" align="center">
          {widgetTypes.map((widget) => {
            const Icon = widget.icon;
            return (
              <Tooltip.Root key={widget.type}>
                <Tooltip.Trigger>
                  <Button
                    appearance="ghost"
                    size="sm"
                    aria-label={widget.name}
                    className={classes.iconOnly}
                    style={{ height: 36, minHeight: 36, width: 36, padding: 0 }}
                    onClick={() => handleAddWidget(widget.type)}
                  >
                    <Icon size={20} />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Popup placement="end">{widget.name}</Tooltip.Popup>
              </Tooltip.Root>
            );
          })}
        </Stack>
      ) : (
        <div className={classes.content}>
          <Text size="sm" weight="semibold" tone="secondary" className={classes.panelTitle}>
            ADD WIDGETS
          </Text>
          <Stack gap="md">
            {widgetTypes.map((widget) => {
              const Icon = widget.icon;
              return (
                <Button
                  appearance="ghost"
                  size="sm"
                  key={widget.type}
                  className={classes.widgetRow}
                  style={{
                    height: "auto",
                    minHeight: 0,
                    justifyContent: "flex-start",
                    padding: "8px 6px",
                    gap: 12,
                  }}
                  onClick={() => handleAddWidget(widget.type)}
                >
                  <div className={classes.widgetIcon}>
                    <Icon size={20} />
                  </div>
                  <div className={classes.widgetCopy}>
                    <Text as="span" size="md" weight="medium">
                      {widget.name}
                    </Text>
                    <Text as="span" size="sm" tone="secondary" lineClamp={1}>
                      {widget.description}
                    </Text>
                  </div>
                </Button>
              );
            })}
          </Stack>
        </div>
      )}
    </aside>
  );
}

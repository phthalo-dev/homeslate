import { useEffect, useRef, useState } from "react";
import {
  Text,
  Stack,
  Button,
  HStack,
  Spinner,
  Alert,
  FileInput,
  Link,
  NumberInput,
  ProgressBar,
  Tabs,
  TextField,
  IconButton,
  SimpleGrid,
  SimpleTooltip,
} from "@var-ui/react";
import { IconLayoutGrid, IconExternalLink, IconX } from "@tabler/icons-react";
import type { WidgetProps, WidgetConfig } from "../types";
import { useGooglePhotoCollage } from "../hooks/useGooglePhotoCollage";
import { useGooglePhotos } from "../hooks/useGooglePhotos";
import { useGoogleRuntime } from "../googleRuntime";
import { loadStoredImage } from "../services/googlePhotos";
import { useOverlayPortalContainer } from "../overlayPortal";
import type { StoredImage } from "../services/googlePhotos";
import type { Photo, StoredPhoto } from "./PhotoWidget";
import * as classes from "./GooglePhotoCollageWidget.styles";

export interface GooglePhotoCollageConfig extends WidgetConfig {
  rotationInterval: number; // seconds between individual photo changes
  transparentBackground: boolean;
  photos: Photo[];
}

// ── Layout helpers ────────────────────────────────────────────────────────────

/**
 * Given pixel dimensions of the widget, compute how many masonry columns and
 * rows to use and the CSS grid-template-columns/rows strings.
 *
 * Strategy:
 *   - Target ~200px per cell (minimum)
 *   - cols = max(1, floor(width / 200))
 *   - rows = max(1, floor(height / 200))
 *   - slotCount = cols * rows
 */
function computeLayout(width: number, height: number) {
  const TARGET_CELL = 200;
  const cols = Math.max(1, Math.floor(width / TARGET_CELL));
  const rows = Math.max(1, Math.floor(height / TARGET_CELL));
  const slotCount = cols * rows;

  // Assign varying grid spans to make it feel masonry-like.
  // We tile a repeating pattern of span configurations.
  // For a 2-col grid: alternating tall/wide cells.
  // For 3+ cols: some cells span 2 columns or 2 rows.
  const spans = buildSpanPattern(cols, rows, slotCount);

  return { cols, rows, slotCount, spans };
}

interface CellSpan {
  colSpan: number;
  rowSpan: number;
}

/**
 * Produce a list of {colSpan, rowSpan} for `slotCount` cells that tile within
 * a `cols × rows` grid without overflowing. Uses a simple greedy packing
 * algorithm with a fixed pattern of "large" and "small" cells.
 */
function buildSpanPattern(cols: number, rows: number, slotCount: number): CellSpan[] {
  // For very small grids (1 cell) just fill.
  if (slotCount === 1) return [{ colSpan: 1, rowSpan: 1 }];

  // Build an occupancy grid
  const occupied = Array.from({ length: rows }, () => Array(cols).fill(false));

  function firstFree(): [number, number] | null {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!occupied[r][c]) return [r, c];
      }
    }
    return null;
  }

  function canPlace(r: number, c: number, rs: number, cs: number): boolean {
    if (r + rs > rows || c + cs > cols) return false;
    for (let dr = 0; dr < rs; dr++) {
      for (let dc = 0; dc < cs; dc++) {
        if (occupied[r + dr][c + dc]) return false;
      }
    }
    return true;
  }

  function place(r: number, c: number, rs: number, cs: number) {
    for (let dr = 0; dr < rs; dr++) {
      for (let dc = 0; dc < cs; dc++) {
        occupied[r + dr][c + dc] = true;
      }
    }
  }

  const result: CellSpan[] = [];

  // Candidates in priority order: try larger spans first for variety
  const candidates: [number, number][] =
    cols >= 3 && rows >= 3
      ? [
          [2, 2],
          [2, 1],
          [1, 2],
          [1, 1],
        ]
      : cols >= 2 && rows >= 2
        ? [
            [2, 1],
            [1, 2],
            [1, 1],
          ]
        : [[1, 1]];

  // Every ~4 cells insert a larger cell for variety; rest are 1×1
  let cellsPlaced = 0;

  while (result.length < slotCount) {
    const pos = firstFree();
    if (!pos) break;
    const [r, c] = pos;

    // Try a larger span every 3 placements for visual variety
    let placed = false;
    if (cellsPlaced % 3 === 0 && candidates[0][0] > 1) {
      for (const [rs, cs] of candidates) {
        if (rs === 1 && cs === 1) continue; // skip 1×1 in "large" turn
        if (canPlace(r, c, rs, cs)) {
          place(r, c, rs, cs);
          result.push({ colSpan: cs, rowSpan: rs });
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      place(r, c, 1, 1);
      result.push({ colSpan: 1, rowSpan: 1 });
    }

    cellsPlaced++;
  }

  return result;
}

// ── Upload helper (shared with PhotoWidget) ────────────────────────────────────

async function uploadPhoto(payload: {
  dataUrl?: string;
  url?: string;
  filename?: string;
}): Promise<{ key: string; filename: string }> {
  const res = await fetch("/api/photo-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ key: string; filename: string }>;
}

// ── Convert Photo[] to StoredImage[] for the collage hook ─────────────────────

function photosToStoredImages(photos: Photo[]): StoredImage[] {
  return photos
    .filter((p): p is StoredPhoto => p.type === "stored")
    .map((p) => ({ key: p.key, filename: p.filename }));
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function GooglePhotoCollageWidget({ widget }: WidgetProps<GooglePhotoCollageConfig>) {
  const { rotationInterval, transparentBackground, photos } = widget.config;

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { cols, rows, slotCount, spans } = computeLayout(dimensions.width, dimensions.height);

  // Convert Photo[] to StoredImage[] for the collage hook (only stored photos are supported)
  const savedImages: StoredImage[] =
    photos && photos.length > 0 ? photosToStoredImages(photos) : [];

  const { pickerStatus, error, slots, transitioningSlot } = useGooglePhotoCollage({
    slotCount,
    rotationInterval: rotationInterval * 1000,
    savedImages,
  });

  const containerClass = `${classes.container} ${transparentBackground ? classes.transparent : ""}`;

  if (!photos || photos.length === 0) {
    return (
      <div ref={containerRef} className={containerClass}>
        <div className={classes.stateContainer}>
          <IconLayoutGrid size={48} className={classes.emptyIcon} />
          <Text size="lg" weight="medium">
            No Photos Selected
          </Text>
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            Open widget settings to add photos to your collage
          </Text>
        </div>
      </div>
    );
  }

  if (pickerStatus === "uploading") {
    return (
      <div ref={containerRef} className={containerClass}>
        <div className={classes.stateContainer}>
          <Spinner size="lg" />
          <Text size="sm" tone="secondary">
            Saving photos...
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div ref={containerRef} className={containerClass}>
        <Alert variant="danger" appearance="subtle">
          <Text size="sm">{error}</Text>
        </Alert>
      </div>
    );
  }

  // Show loading state while resolving URLs
  if (savedImages.length === 0 && photos.length > 0) {
    return (
      <div ref={containerRef} className={containerClass}>
        <div className={classes.stateContainer}>
          <Spinner size="lg" />
          <Text size="sm" tone="secondary">
            Loading photos...
          </Text>
        </div>
      </div>
    );
  }

  // ── Photo grid ──────────────────────────────────────────────────────────────

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  };

  return (
    <div ref={containerRef} className={containerClass}>
      <div className={classes.grid} style={gridStyle}>
        {slots.slice(0, slotCount).map((photo, idx) => {
          const span = spans[idx] ?? { colSpan: 1, rowSpan: 1 };
          const isFading = transitioningSlot === idx;

          return (
            <div
              key={idx}
              className={classes.cell}
              style={{
                gridColumn: `span ${span.colSpan}`,
                gridRow: `span ${span.rowSpan}`,
              }}
            >
              {photo ? (
                <div
                  className={`${classes.photo} ${isFading ? classes.fading : ""}`}
                  style={{ backgroundImage: `url(${photo.objectUrl})` }}
                />
              ) : (
                <div className={classes.photoSkeleton} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Thumbnail grid (settings) ─────────────────────────────────────────────────

interface PhotoThumbGridProps {
  photos: Photo[];
  onRemove: (index: number) => void;
}

function PhotoThumbGrid({ photos, onRemove }: PhotoThumbGridProps) {
  const portalContainer = useOverlayPortalContainer();
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
              // skip
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
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.clear();
    };
  }, []);

  if (photos.length === 0) return null;

  return (
    <SimpleGrid cols={3} spacing="xs">
      {photos.map((photo, index) => {
        const id = photo.type === "url" ? photo.url : photo.key;
        const src = thumbUrls.get(id);
        return (
          <div key={index} className={classes.thumbWrapper}>
            {src ? (
              <img src={src} height={80} style={{ objectFit: "cover" }} className={classes.thumb} />
            ) : (
              <div className={classes.thumbPlaceholder}>
                <Spinner size="sm" />
              </div>
            )}
            <SimpleTooltip content="Remove photo" placement="top" portalContainer={portalContainer}>
              <IconButton
                name="close"
                icon={<IconX size={10} />}
                size="sm"
                tone="danger"
                appearance="filled"
                className={classes.thumbRemove}
                aria-label="Remove photo"
                onPress={() => onRemove(index)}
              />
            </SimpleTooltip>
          </div>
        );
      })}
    </SimpleGrid>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

const ROTATION_PRESETS = [
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
  { value: 300, label: "5m" },
];
const ROTATION_PRESET_VALUES = ROTATION_PRESETS.map((p) => p.value);

export function GooglePhotoCollageWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<GooglePhotoCollageConfig>) {
  const { rotationInterval, photos = [] } = widget.config;

  // URL tab state
  const [newUrl, setNewUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlUploading, setUrlUploading] = useState(false);

  // Upload tab state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Google Photos tab
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

  // When Google Photos picker completes, add the newly stored images as StoredPhotos
  const lastSavedGoogleBatchRef = useRef<string | null>(null);
  useEffect(() => {
    if (pickerStatus === "ready" && storedImages.length > 0) {
      const batchKey = storedImages
        .map((img) => img.key)
        .sort()
        .join("|");
      if (lastSavedGoogleBatchRef.current === batchKey) return;
      lastSavedGoogleBatchRef.current = batchKey;

      const newPhotos: StoredPhoto[] = storedImages.map((img) => ({
        type: "stored",
        key: img.key,
        filename: img.filename,
      }));
      // Avoid duplicates (by key)
      const existingKeys = new Set(
        photos.filter((p): p is StoredPhoto => p.type === "stored").map((p) => p.key),
      );
      const toAdd = newPhotos.filter((p) => !existingKeys.has(p.key));
      if (toAdd.length > 0) {
        onConfigChange({ photos: [...photos, ...toAdd] });
      }
    }
    if (pickerStatus === "idle") {
      lastSavedGoogleBatchRef.current = null;
    }
  }, [pickerStatus, storedImages, photos, onConfigChange]);

  const removePhoto = (index: number) => {
    onConfigChange({ photos: photos.filter((_, i) => i !== index) });
  };

  // Add a URL photo — store on server to avoid CORS issues
  const addUrlPhoto = async () => {
    if (!newUrl.trim()) return;
    setUrlError(null);
    setUrlUploading(true);
    try {
      const { key, filename } = await uploadPhoto({
        url: newUrl.trim(),
        filename: newUrl.split("/").pop(),
      });
      onConfigChange({
        photos: [...photos, { type: "stored", key, filename } as StoredPhoto],
      });
      setNewUrl("");
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Failed to add photo");
    } finally {
      setUrlUploading(false);
    }
  };

  // Handle device file upload
  const handleFileUpload = async (files: File[] | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);

    const newPhotos: StoredPhoto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setUploadError(`"${file.name}" is not an image file`);
        continue;
      }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
        const { key, filename } = await uploadPhoto({ dataUrl, filename: file.name });
        newPhotos.push({ type: "stored", key, filename });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : `Failed to upload "${file.name}"`);
      }
    }

    if (newPhotos.length > 0) {
      onConfigChange({ photos: [...photos, ...newPhotos] });
    }
    setUploading(false);
  };

  return (
    <Stack gap="md">
      {/* Current photos */}
      {photos.length > 0 && (
        <Stack gap="xs">
          <Text size="sm" weight="medium">
            Photos ({photos.length})
          </Text>
          <PhotoThumbGrid photos={photos} onRemove={removePhoto} />
        </Stack>
      )}

      {/* Add photos */}
      <Text size="sm" weight="medium">
        Add Photos
      </Text>

      <Tabs
        defaultSelectedKey="url"
        tabs={[
          {
            id: "url",
            label: "URL",
            content: (
              <Stack gap="xs">
                <TextField
                  placeholder="https://example.com/photo.jpg"
                  value={newUrl}
                  onChange={(value) => {
                    setNewUrl(value);
                    setUrlError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void addUrlPhoto();
                  }}
                  size="sm"
                />
                {urlError && (
                  <Alert variant="danger" appearance="subtle">
                    <Text size="sm">{urlError}</Text>
                  </Alert>
                )}
                <Button
                  onPress={() => void addUrlPhoto()}
                  isDisabled={!newUrl.trim()}
                  isPending={urlUploading}
                  size="sm"
                >
                  Add Photo
                </Button>
              </Stack>
            ),
          },
          {
            id: "upload",
            label: "Device",
            content: (
              <Stack gap="xs">
                <FileInput
                  label="Choose photos from this device"
                  description="Supports JPEG, PNG, GIF, WebP. Max 20 MB per photo."
                  accept="image/*"
                  multiple
                  maxSize={20 * 1024 * 1024}
                  value={null}
                  isDisabled={uploading}
                  onChange={(files) => {
                    if (!files) return;
                    void handleFileUpload(Array.isArray(files) ? files : [files]);
                  }}
                />
                {uploadError && (
                  <Alert variant="danger" appearance="subtle">
                    <Text size="sm">{uploadError}</Text>
                  </Alert>
                )}
              </Stack>
            ),
          },
          {
            id: "google",
            label: "Google",
            content: (
              <Stack gap="xs">
                {!isAuthenticated ? (
                  <Stack align="start" gap="sm">
                    <Text size="sm" tone="secondary">
                      Sign in to pick photos from Google Photos
                    </Text>
                    <Button onPress={signIn} isPending={authLoading} size="sm">
                      Sign in with Google
                    </Button>
                  </Stack>
                ) : (
                  <>
                    <Text size="sm" tone="secondary">
                      Connected to Google
                    </Text>

                    {pickerStatus === "pending" && pickerUri && (
                      <Stack gap="xs">
                        <Text size="sm" tone="secondary">
                          Select photos in Google Photos, then come back here.
                        </Text>
                        <Link href={pickerUri} target="_blank">
                          Open Google Photos <IconExternalLink size={12} />
                        </Link>
                      </Stack>
                    )}

                    {pickerStatus === "uploading" && uploadProgress && (
                      <Stack gap="xs">
                        <Text size="sm" tone="secondary">
                          Saving photos… {uploadProgress.done}/{uploadProgress.total}
                        </Text>
                        <ProgressBar value={(uploadProgress.done / uploadProgress.total) * 100} />
                      </Stack>
                    )}

                    {googleError && (
                      <Alert variant="danger" appearance="subtle">
                        <Text size="sm">{googleError}</Text>
                      </Alert>
                    )}

                    <HStack gap="xs">
                      <Button
                        size="sm"
                        onPress={() => {
                          void startPicker();
                        }}
                        isPending={pickerStatus === "pending" || pickerStatus === "uploading"}
                        isDisabled={pickerStatus === "pending" || pickerStatus === "uploading"}
                      >
                        Pick Photos
                      </Button>
                      {storedImages.length > 0 && (
                        <Button
                          size="sm"
                          appearance="ghost"
                          tone="danger"
                          onPress={clearGoogleSelection}
                        >
                          Cancel
                        </Button>
                      )}
                    </HStack>
                  </>
                )}
              </Stack>
            ),
          },
        ]}
      />

      {/* Rotation speed */}
      <Stack gap="xs">
        <Text size="sm" weight="medium">
          Rotation Speed
        </Text>
        <Text size="sm" tone="secondary">
          How often a single photo in the collage is replaced
        </Text>
        <HStack gap="xs" wrap>
          {ROTATION_PRESETS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              appearance={rotationInterval === value ? "filled" : "outline"}
              onPress={() => onConfigChange({ rotationInterval: value })}
            >
              {label}
            </Button>
          ))}
          <Button
            size="sm"
            appearance={!ROTATION_PRESET_VALUES.includes(rotationInterval) ? "filled" : "outline"}
            onPress={() => {
              if (ROTATION_PRESET_VALUES.includes(rotationInterval)) {
                onConfigChange({ rotationInterval: 20 });
              }
            }}
          >
            Custom
          </Button>
        </HStack>
        {!ROTATION_PRESET_VALUES.includes(rotationInterval) && (
          <NumberInput
            placeholder="Seconds"
            value={rotationInterval}
            onChange={(val) => {
              const num = typeof val === "number" ? val : parseInt(String(val), 10);
              if (!isNaN(num) && num >= 5) onConfigChange({ rotationInterval: num });
            }}
            minValue={5}
            maxValue={86400}
          />
        )}
      </Stack>

      {/* Remove all */}
      {photos.length > 0 && (
        <Button
          tone="danger"
          appearance="ghost"
          size="sm"
          onPress={() => onConfigChange({ photos: [] })}
        >
          Remove All Photos
        </Button>
      )}
    </Stack>
  );
}

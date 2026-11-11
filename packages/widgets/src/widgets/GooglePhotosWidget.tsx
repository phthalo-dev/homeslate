import { useEffect, useRef } from "react";
import {
  Text,
  Stack,
  Switch,
  Button,
  HStack,
  Spinner,
  Alert,
  Link,
  ProgressBar,
} from "@var-ui/react";
import { IconBrandGoogle, IconPhoto, IconExternalLink } from "@tabler/icons-react";
import type { WidgetProps, WidgetConfig } from "../types";
import { useGooglePhotos } from "../hooks/useGooglePhotos";
import { useGoogleRuntime } from "../googleRuntime";
import type { StoredImage } from "../services/googlePhotos";
import * as classes from "./GooglePhotosWidget.styles";

export interface GooglePhotosConfig extends WidgetConfig {
  showCaption: boolean;
  refreshInterval: number;
  transparentBackground: boolean;
  savedImages?: StoredImage[];
}

export function GooglePhotosWidget({ widget }: WidgetProps<GooglePhotosConfig>) {
  const { refreshInterval, transparentBackground, savedImages } = widget.config;

  const { isAuthenticated, pickerStatus, error, pickerUri, currentPhoto } = useGooglePhotos({
    refreshInterval: refreshInterval * 1000,
    savedImages,
  });

  if (!isAuthenticated && pickerStatus === "idle") {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.signIn}>
          <IconBrandGoogle size={48} className={classes.googleIcon} />
          <Text size="lg" weight="medium">
            Google Photos
          </Text>
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            Sign in using the button in the header to view your photos
          </Text>
        </div>
      </div>
    );
  }

  if (pickerStatus === "idle") {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconPhoto size={48} className={classes.emptyIcon} />
          <Text size="lg" weight="medium">
            No Photos Selected
          </Text>
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            Open widget settings to pick photos from Google Photos
          </Text>
        </div>
      </div>
    );
  }

  if (pickerStatus === "pending") {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.loading}>
          <Spinner size="lg" />
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            Waiting for you to select photos in Google Photos...
          </Text>
          {pickerUri && (
            <Link href={pickerUri} target="_blank">
              Open Google Photos picker <IconExternalLink size={12} />
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (pickerStatus === "uploading") {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.loading}>
          <Spinner size="lg" />
          <Text size="sm" tone="secondary">
            Saving selected photos...
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <Alert tone="danger" appearance="subtle">
          <Text size="sm">{error}</Text>
        </Alert>
      </div>
    );
  }

  if (!currentPhoto) {
    return (
      <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
        <div className={classes.empty}>
          <IconPhoto size={48} className={classes.emptyIcon} />
          <Text size="lg" weight="medium">
            No Photos
          </Text>
          <Text size="sm" tone="secondary" style={{ textAlign: "center" }}>
            No images found in your selection
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={`${classes.container} ${transparentBackground ? classes.transparent : ""}`}>
      <div
        className={classes.photo}
        style={{ backgroundImage: `url(${currentPhoto.objectUrl})` }}
      />
      <div className={classes.overlay} />
    </div>
  );
}

export function GooglePhotosWidgetSettings({
  widget,
  onConfigChange,
}: WidgetProps<GooglePhotosConfig>) {
  const { showCaption, refreshInterval, savedImages } = widget.config;

  const { isAuthenticated, isLoading, signIn } = useGoogleRuntime();
  const {
    pickerStatus,
    uploadProgress,
    error,
    pickerUri,
    storedImages,
    startPicker,
    clearSelection,
  } = useGooglePhotos({ savedImages });

  const hasSelection = storedImages.length > 0;

  // Persist stored images to widget config once when a new selection completes.
  const savedRef = useRef(false);
  useEffect(() => {
    if (pickerStatus === "ready" && storedImages.length > 0 && !savedRef.current) {
      savedRef.current = true;
      onConfigChange({ savedImages: storedImages });
    }
    if (pickerStatus === "idle") {
      savedRef.current = false;
    }
  }, [pickerStatus, storedImages, onConfigChange]);

  return (
    <Stack gap="md">
      <div className={classes.authSection}>
        {isAuthenticated ? (
          <Text size="sm" tone="secondary">
            Connected to Google
          </Text>
        ) : (
          <Stack align="center" gap="sm">
            <Text size="sm" tone="secondary">
              Sign in to select your photos
            </Text>
            <Button onClick={signIn} loading={isLoading} size="sm">
              Sign in with Google
            </Button>
          </Stack>
        )}
      </div>

      {isAuthenticated && (
        <>
          <Stack gap="xs">
            <Text size="sm" weight="medium">
              Photo Selection
            </Text>

            {hasSelection && (
              <Text size="sm" tone="secondary">
                {storedImages.length} photo{storedImages.length !== 1 ? "s" : ""} saved
              </Text>
            )}

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

            {error && (
              <Alert tone="danger" appearance="subtle">
                <Text size="sm">{error}</Text>
              </Alert>
            )}

            <HStack gap="xs">
              <Button
                size="sm"
                onClick={() => {
                  void startPicker();
                }}
                loading={pickerStatus === "pending" || pickerStatus === "uploading"}
                disabled={pickerStatus === "pending" || pickerStatus === "uploading"}
              >
                {hasSelection ? "Change Photos" : "Pick Photos"}
              </Button>

              {hasSelection && (
                <Button
                  size="sm"
                  appearance="ghost"
                  tone="danger"
                  onClick={() => {
                    clearSelection();
                    onConfigChange({ savedImages: [] });
                  }}
                >
                  Clear
                </Button>
              )}
            </HStack>
          </Stack>

          <HStack justify="between">
            <Text size="sm">Show Caption</Text>
            <Switch
              checked={showCaption}
              onCheckedChange={(value) => onConfigChange({ showCaption: value })}
            />
          </HStack>

          <Stack gap="xs">
            <Text size="sm" weight="medium">
              Refresh Interval
            </Text>
            <HStack gap="xs" wrap>
              {[
                { value: 30, label: "30s" },
                { value: 60, label: "1m" },
                { value: 300, label: "5m" },
                { value: 600, label: "10m" },
                { value: 1800, label: "30m" },
                { value: 3600, label: "1h" },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  appearance={refreshInterval === value ? "filled" : "outline"}
                  onClick={() => onConfigChange({ refreshInterval: value })}
                >
                  {label}
                </Button>
              ))}
            </HStack>
          </Stack>
        </>
      )}
    </Stack>
  );
}

import { useEffect, useMemo, type CSSProperties } from "react";
import { defaultTheme, disposeDesignTheme, registerDefaultTheme } from "@var-ui/core";
import type { ColorMode, ThemeDocument } from "@homeslate/schema";
import { toDesignThemeTokens } from "./themeTokens";

/** What a theme document compiles to (a child of var-ui's default theme). */
export type DisplayTheme = ReturnType<typeof defaultTheme.override>;

export function displayThemeName(docId: string): string {
  return `homeslate-${docId}`;
}

export function previewDisplayThemeName(docId: string): string {
  return `${displayThemeName(docId)}-preview`;
}

export function createDisplayTheme(
  doc: ThemeDocument,
  name = displayThemeName(doc.id),
): DisplayTheme {
  // Themes are children of the default theme, so it has to be registered first (idempotent).
  registerDefaultTheme();
  return defaultTheme.override({
    name,
    tokens: toDesignThemeTokens(doc),
  } as Parameters<typeof defaultTheme.override>[0]);
}

function readModeAwareString(value: unknown, mode: ColorMode): string | undefined {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const picked = record[mode] ?? record.light ?? record.dark;
  return typeof picked === "string" ? picked : undefined;
}

export function getCanvasBackgroundStyle(doc: ThemeDocument, mode: ColorMode): CSSProperties {
  const backgroundImage = readModeAwareString(doc.extend?.canvas?.backgroundImage, mode);
  return backgroundImage ? { backgroundImage } : {};
}

export function createInactivePreviewThemeDispose(previewId: string): () => void {
  return () => {
    disposeDesignTheme(previewDisplayThemeName(previewId));
  };
}

export function useCompiledDisplayTheme(doc: ThemeDocument): DisplayTheme {
  const tokensKey = JSON.stringify(doc.tokens ?? null);
  const colorModeKey = JSON.stringify(doc.colorMode ?? null);
  const extendKey = JSON.stringify(doc.extend ?? null);
  const theme = useMemo(
    () => createDisplayTheme(doc),
    // tokens/colorMode/extend identity is unstable across persist; serialize instead
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see serialized keys above
    [doc.id, tokensKey, colorModeKey, extendKey],
  );
  useEffect(() => () => disposeDesignTheme(displayThemeName(doc.id)), [doc.id]);
  return theme;
}

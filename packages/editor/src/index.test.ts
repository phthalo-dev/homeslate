import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { EDITOR_PACKAGE_NAME, Editor } from "@homeslate/editor";

describe("@homeslate/editor", () => {
  it("is importable by package name", () => {
    expect(EDITOR_PACKAGE_NAME).toBe("@homeslate/editor");
  });

  it("exports Editor", () => {
    expect(typeof Editor).toBe("function");
  });

  it("Editor source does not import hosted auth, api, or store", () => {
    const source = readFileSync(new URL("./Editor.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/AuthContext/);
    expect(source).not.toMatch(/apiClient/);
    expect(source).not.toMatch(/dashboardStore/);
    expect(source).not.toMatch(/react-router/);
  });

  it("nests DesignSystemProvider with the active compiled theme, not applyToDocument", () => {
    const source = readFileSync(new URL("./Editor.tsx", import.meta.url), "utf8");
    expect(source).toMatch(/from ["']@var-ui\/react["']/);
    expect(source).toMatch(/DesignSystemProvider/);
    expect(source).toMatch(/useCompiledDisplayTheme/);
    expect(source).toMatch(/pickActiveDocument/);
    expect(source).toMatch(/customTheme=\{theme\}/);
    expect(source).not.toMatch(/tokenVars/);
    expect(source).not.toMatch(/resolveDisplayThemeVars/);
    expect(source).not.toMatch(/applyToDocument/);
    expect(source).not.toMatch(/document\.documentElement/);
    expect(source).toMatch(/getCanvasBackgroundStyle/);
  });

  it("keeps editor chrome actions as small ghost buttons", () => {
    const source = readFileSync(new URL("./Editor.tsx", import.meta.url), "utf8");
    expect(source).toMatch(/appearance="ghost"/);
    expect(source).toMatch(/size="sm"/);
    expect(source).toMatch(/Background Settings/);
  });

  it("adds widgets with VarUI ghost buttons instead of raw button elements", () => {
    const source = readFileSync(new URL("./WidgetPanel.tsx", import.meta.url), "utf8");
    const list = source.slice(source.indexOf("export function WidgetPanel"));
    expect(list).toMatch(/<Button[\s\S]{0,200}className=\{classes\.widgetRow\}/);
    expect(list).toMatch(/<Button[\s\S]{0,200}className=\{classes\.iconOnly\}/);
    expect(list).toMatch(/height:\s*["']auto["']/);
    expect(list).toMatch(/className=\{classes\.iconOnly\}[\s\S]{0,180}height:\s*36/);
    expect(list).toMatch(/as="span"/);
    expect(list).not.toMatch(/<button\b/);
  });

  it("WidgetPanel source does not import hosted auth, api, or store", () => {
    const source = readFileSync(new URL("./WidgetPanel.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/AuthContext/);
    expect(source).not.toMatch(/apiClient/);
    expect(source).not.toMatch(/dashboardStore/);
    expect(source).toMatch(/useGoogleRuntime/);
  });

  it("WidgetPanel writes the patched document onto documentRef before onChange", () => {
    const source = readFileSync(new URL("./WidgetPanel.tsx", import.meta.url), "utf8");
    expect(source).toMatch(
      /const next = addWidget\(documentRef\.current, viewId, widget\);\s*documentRef\.current = next;\s*onChange\?\.\(next\);/,
    );
  });

  it("WidgetPanel places new widgets with findAvailablePosition", () => {
    const source = readFileSync(new URL("./WidgetPanel.tsx", import.meta.url), "utf8");
    expect(source).toMatch(/findAvailablePosition/);
    expect(source).not.toMatch(/x:\s*0,\s*\n\s*y:\s*0,/);
  });

  it("opens ThemeEditor from editor chrome and writes themes onto the document", () => {
    const source = readFileSync(new URL("./Editor.tsx", import.meta.url), "utf8");
    expect(source).toMatch(/ThemeEditor/);
    expect(source).toMatch(/>\s*Themes\s*</);
    expect(source).toMatch(/activeThemeId/);
    expect(source).toMatch(/setThemesOpen/);
  });

  it("exports ThemeEditor", async () => {
    const { ThemeEditor } = await import("@homeslate/editor");
    expect(typeof ThemeEditor).toBe("function");
  });

  it("ThemeEditor source does not import hosted auth, api, or store", () => {
    const source = readFileSync(new URL("./ThemeEditor.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/AuthContext/);
    expect(source).not.toMatch(/apiClient/);
    expect(source).not.toMatch(/dashboardStore/);
    expect(source).toMatch(/previewViews/);
    expect(source).toMatch(/DocumentCanvas/);
  });

  it("uses public VarUI radius and tone tokens, not invented names", () => {
    assertNoInventedVarUiTokens(dirname(fileURLToPath(import.meta.url)));
  });
});

function walkSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSourceFiles(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry.name)) continue;
    out.push(full);
  }
  return out;
}

function assertNoInventedVarUiTokens(root: string) {
  const files = walkSourceFiles(root);
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    expect(source, file).not.toMatch(/--var-ui-color-danger(?!-)/);
    expect(source, file).not.toMatch(/--var-ui-color-success(?!-)/);
    expect(source, file).not.toMatch(/--var-ui-radius-xs/);
  }
}

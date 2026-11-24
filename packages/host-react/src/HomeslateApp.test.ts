import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";

function read(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

describe("HomeslateApp", () => {
  it("mounts Editor and Display from packages and does not import hosted auth", () => {
    const source = read("./pages.tsx") + read("./displayPages.tsx");
    expect(source).toMatch(/from ['"]@homeslate\/editor['"]/);
    expect(source).toMatch(/from ['"]@homeslate\/display['"]/);
    expect(source).not.toMatch(/AuthContext/);
    expect(source).not.toMatch(/dashboardStore/);
    expect(source).not.toMatch(/apiClient/);
    expect(source).not.toMatch(/netlify/);
    expect(source).not.toMatch(/drizzle-orm/);
  });

  it("flushes the pending editor PUT on unmount", () => {
    const source = read("./useDisplayDocument.ts");
    expect(source).toMatch(/createDebouncedPersist/);
    expect(source).toMatch(/\.flush\(/);
  });

  it("routes the display list, management, view editor, and kiosk", () => {
    const source = read("./HomeslateApp.tsx");
    expect(source).toMatch(/path="\/"\s+element=\{<DisplayListPage/);
    // Management sections and the view editor are children of one layout, so the app bars persist.
    expect(source).toMatch(/path="\/edit\/:id"[\s\S]*?<DisplayLayout/);
    expect(source).toMatch(/<Route index element=\{<DisplayViewsPage/);
    expect(source).toMatch(/path="settings" element=\{<DisplaySettingsPage/);
    expect(source).toMatch(/path="theme" element=\{<DisplayThemePage/);
    expect(source).toMatch(/path="views\/:viewId" element=\{<ViewEditorPage/);
    expect(source).toMatch(/path="\/d\/:publicId"[\s\S]*?<KioskPage/);
    expect(source).toMatch(/RouteErrorBoundary/);

    const kiosk = read("./pages.tsx");
    expect(kiosk).toMatch(/recovery="retry"/);
    expect(kiosk).toMatch(/<Display/);
  });

  it("manages multiple views through the display document helpers", () => {
    const source = read("./ViewsPanel.tsx");
    expect(source).toMatch(/from ['"]@homeslate\/display\/canvas['"]/);
    expect(source).toMatch(/\baddView\b/);
    expect(source).toMatch(/\bremoveView\b/);
    expect(source).toMatch(/\bmoveView\b/);
    expect(source).toMatch(/\bpatchView\b/);
    expect(source).toMatch(/\baddPresetViews\b/);
    expect(source).toMatch(/\bmissingPresetViews\b/);
    expect(source).toMatch(/\bduplicateView\b/);
  });

  it("renames the display from the management header", () => {
    const source = read("./DisplayLayout.tsx");
    expect(source).toMatch(/DisplayNameHeading/);
    expect(source).toMatch(/onRename=/);
    expect(source).toMatch(/setDocument\(\{ \.\.\.loaded\.document, name \}\)/);
  });

  it("wires display settings for alarms, rotation, and passcode", () => {
    const settings = read("./DisplaySettingsPanel.tsx");
    expect(settings).toMatch(/AlarmListEditor/);
    expect(settings).toMatch(/rotation/);
    expect(settings).toMatch(/PinInput/);
    expect(settings).toMatch(/onSetPasscode/);

    expect(read("./displayPages.tsx")).toMatch(/DisplaySettingsPanel/);
    const pages = read("./pages.tsx");
    expect(pages).toMatch(/getPublicDocument/);
    expect(pages).toMatch(/passcodeRequired/);
  });
});

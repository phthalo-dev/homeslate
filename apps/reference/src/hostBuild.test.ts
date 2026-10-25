import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getRegisteredCss, reset } from "typestyles";
import { afterEach, describe, expect, it } from "vite-plus/test";

/** tsconfig files are JSONC, so drop comments before parsing. */
function readJson<T>(relativePath: string): T {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(source) as T;
}

afterEach(() => {
  reset();
});

describe("reference app build boundary", () => {
  it("uses package-only root tsconfig.app.json (reference has its own solution)", () => {
    const rootApp = readJson<{ include: string[] }>("../../../tsconfig.app.json");
    const rootNode = readJson<{ include: string[] }>("../../../tsconfig.node.json");
    const solution = readJson<{ references: Array<{ path: string }> }>("../../../tsconfig.json");

    for (const entry of rootApp.include) {
      expect(entry).toMatch(/^packages\//);
    }
    expect(rootNode.include).toEqual(["vite.config.ts", "apps/reference/vite.config.ts"]);
    for (const reference of solution.references) {
      expect(reference.path).not.toContain("apps/reference");
    }
  });

  it("typechecks its server with Node libs and its web entry with DOM libs", () => {
    const own = readJson<{ references: Array<{ path: string }> }>("../tsconfig.json");
    expect(own.references.map((reference) => reference.path)).toEqual([
      "./tsconfig.server.json",
      "./tsconfig.web.json",
    ]);

    const server = readJson<{ compilerOptions: { lib: string[]; types: string[] } }>(
      "../tsconfig.server.json",
    );
    expect(server.compilerOptions.lib).not.toContain("DOM");
    expect(server.compilerOptions.types).toContain("node");

    const web = readJson<{ compilerOptions: { lib: string[]; jsx: string } }>(
      "../tsconfig.web.json",
    );
    expect(web.compilerOptions.lib).toContain("DOM");
    expect(web.compilerOptions.jsx).toBe("react-jsx");
  });

  it("starts the Vite UI from the package dev script, not only the API", () => {
    const manifest = readJson<{ scripts: Record<string, string> }>("../package.json");
    expect(manifest.scripts["dev:api"]).toMatch(/dev-api\.ts/);
    expect(manifest.scripts["dev:web"]).toMatch(/vp dev|vite/);
    expect(manifest.scripts.dev).toMatch(/dev\.ts/);

    const orchestrator = readFileSync(new URL("../src/server/dev.ts", import.meta.url), "utf8");
    expect(orchestrator).toMatch(/dev:api/);
    expect(orchestrator).toMatch(/dev:web/);

    // `dev:api` boots the workspace-resolving entry, which delegates to the real
    // listen entry, so the API still ends up running `listen.ts`.
    const apiEntry = readFileSync(new URL("../src/server/dev-api.ts", import.meta.url), "utf8");
    expect(apiEntry).toMatch(/\.\/listen\.ts/);
  });

  it("loads the theme preset webfonts the compiled display theme names", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(html).toContain("fonts.googleapis.com");
    expect(html).toContain("Outfit");
    expect(html).toContain("Space+Grotesk");
  });

  it("extracts TypeStyles from the published package style entries", () => {
    const viteConfig = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
    expect(viteConfig).toContain("@typestyles/vite");

    const entry = readFileSync(new URL("../typestyles-entry.ts", import.meta.url), "utf8");
    expect(entry).toContain("@var-ui/core/register-default-theme");
    expect(entry).toContain("@homeslate/widgets/styles");
    expect(entry).toContain("@homeslate/display/styles");
    expect(entry).toContain("@homeslate/editor/styles");
  });

  it("registers the default VarUI theme surface from the extract entry", async () => {
    reset();
    await import("../typestyles-entry");
    const css = getRegisteredCss();
    expect(css).toContain(".theme-var-ui-default");
    expect(css).toMatch(/--var-ui-color-background-app:\s*light-dark\(/);
  });

  // @var-ui/core and @var-ui/react depend on this exact typestyles version. A different copy would
  // get its own style registry, so var-ui's theme and our styles would never meet.
  it("pins the same TypeStyles version as var-ui on widgets, display, editor, and the reference app", () => {
    const manifests = [
      "../../../packages/widgets/package.json",
      "../../../packages/display/package.json",
      "../../../packages/editor/package.json",
      "../package.json",
    ];
    for (const relative of manifests) {
      const manifest = readJson<{
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>(relative);
      const range = manifest.dependencies?.typestyles ?? manifest.devDependencies?.typestyles;
      expect(range, relative).toBe("0.32.1");
    }
  });

  it("does not depend on the dropped Mantine packages", () => {
    const droppedPrefix = `@${"mantine"}/`;
    const manifests = [
      "../../../packages/widgets/package.json",
      "../../../packages/display/package.json",
      "../../../packages/editor/package.json",
      "../package.json",
    ];
    for (const relative of manifests) {
      const manifest = readJson<{
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>(relative);
      const names = [
        ...Object.keys(manifest.dependencies ?? {}),
        ...Object.keys(manifest.devDependencies ?? {}),
      ];
      for (const name of names) {
        expect(name.startsWith(droppedPrefix), `${relative} ${name}`).toBe(false);
      }
    }
  });

  it("does not keep Mantine CSS variables in package or reference styles", () => {
    const roots = [
      join(fileURLToPath(new URL("../../../packages", import.meta.url))),
      join(fileURLToPath(new URL(".", import.meta.url)), ".."),
    ];
    const leftover = "--" + "mantine-";
    const files: string[] = [];
    for (const root of roots) {
      files.push(...walkStyleFiles(root));
    }
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source.includes(leftover), file).toBe(false);
    }
  });
});

function walkStyleFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "data") {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkStyleFiles(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry.name)) continue;
    out.push(full);
  }
  return out;
}

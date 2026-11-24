import { fileURLToPath } from "node:url";
import { defineConfig, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";
import typestyles from "@typestyles/vite";
import { VitePWA } from "vite-plugin-pwa";
import { referencePwaOptions } from "./src/pwa";

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: lazyPlugins(() => [
    react(),
    typestyles({
      // The extract entry is evaluated against built packages while the app graph aliases workspace
      // sources, so the coverage check reports recipes that are in the entry (phthalo-dev/typestyles#384).
      coverage: false,
      extract: {
        modules: ["typestyles-entry.ts"],
      },
    }),
    VitePWA(referencePwaOptions),
  ]),
  resolve: {
    alias: {
      "@homeslate/widgets/styles": fileURLToPath(
        new URL("../../packages/widgets/src/styles.ts", import.meta.url),
      ),
      "@homeslate/display/styles": fileURLToPath(
        new URL("../../packages/display/src/styles.ts", import.meta.url),
      ),
      "@homeslate/editor/styles": fileURLToPath(
        new URL("../../packages/editor/src/styles.ts", import.meta.url),
      ),
      "@homeslate/schema": fileURLToPath(
        new URL("../../packages/schema/src/index.ts", import.meta.url),
      ),
      "@homeslate/google": fileURLToPath(
        new URL("../../packages/google/src/index.ts", import.meta.url),
      ),
      "@homeslate/widgets/schemas": fileURLToPath(
        new URL("../../packages/widgets/src/schemas.ts", import.meta.url),
      ),
      "@homeslate/widgets/server": fileURLToPath(
        new URL("../../packages/widgets/src/server.ts", import.meta.url),
      ),
      "@homeslate/widgets": fileURLToPath(
        new URL("../../packages/widgets/src/index.ts", import.meta.url),
      ),
      "@homeslate/display/canvas": fileURLToPath(
        new URL("../../packages/display/src/canvas/index.ts", import.meta.url),
      ),
      "@homeslate/display": fileURLToPath(
        new URL("../../packages/display/src/index.ts", import.meta.url),
      ),
      "@homeslate/editor": fileURLToPath(
        new URL("../../packages/editor/src/index.ts", import.meta.url),
      ),
      "@homeslate/adapters": fileURLToPath(
        new URL("../../packages/adapters/src/index.ts", import.meta.url),
      ),
      "@homeslate/host-react/styles": fileURLToPath(
        new URL("../../packages/host-react/src/styles.ts", import.meta.url),
      ),
      "@homeslate/host-react": fileURLToPath(
        new URL("../../packages/host-react/src/index.ts", import.meta.url),
      ),
    },
  },
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});

import { defaultThemeClassName } from '@var-ui/core';
import varDocs from '@var-ui/docs';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  integrations: [
    varDocs({
      title: 'Homeslate',
      theme: {
        defaultClassName: defaultThemeClassName,
        syntax: 'design-tokens',
        colorMode: { default: 'system', storageKey: 'theme-mode' },
      },
      typestyles: {
        entry: 'typestyles-entry.ts',
      },
      routes: {
        docs: { prefix: '/docs', collection: 'docs' },
      },
      components: {
        Layout: './src/layouts/BaseLayout.astro',
        mdxComponents: './src/mdx-components.ts',
      },
    }),
  ],
  vite: {
    ssr: {
      noExternal: ['@var-ui/docs', '@var-ui/astro', '@var-ui/core'],
    },
  },
});

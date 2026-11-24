import { defaultThemeClassName } from '@var-ui/core';
import varDocs from '@var-ui/docs';
import { defineConfig } from 'astro/config';

/**
 * Wrap every markdown table in a keyboard-focusable scroll region so wide API tables scroll inside
 * the article instead of widening the page (the docs table styles set `display: table`).
 */
function rehypeScrollTables() {
  const text = (n) => (n.type === 'text' ? n.value : (n.children ?? []).map(text).join(''));
  const rows = (n) =>
    n.type === 'element' && n.tagName === 'tr'
      ? [n]
      : (n.children ?? []).flatMap((c) => (c.type === 'element' ? rows(c) : []));
  // Mark the cells of a "Description" column so CSS can keep that column readable on narrow screens.
  const markDescription = (table) => {
    const all = rows(table);
    const head = all[0]?.children.filter((c) => c.type === 'element') ?? [];
    const col = head.findIndex((c) => /^description$/i.test(text(c).trim()));
    if (col < 0) return;
    for (const tr of all) {
      const cell = tr.children.filter((c) => c.type === 'element')[col];
      if (cell) cell.properties = { ...cell.properties, dataWide: '' };
    }
  };
  const wrap = (node) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (child.type === 'element' && child.tagName === 'table') {
        markDescription(child);
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['docs-table-scroll'], role: 'region', ariaLabel: 'Table', tabIndex: 0 },
          children: [child],
        };
      }
      wrap(child);
      return child;
    });
  };
  return (tree) => wrap(tree);
}

export default defineConfig({
  markdown: { rehypePlugins: [rehypeScrollTables] },
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

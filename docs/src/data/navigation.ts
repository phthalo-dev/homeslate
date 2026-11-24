import { getCollection } from 'astro:content';
import type { DocsSearchItem, SidebarSection } from '@var-ui/docs';

export const topNav = [{ text: 'Docs', link: '/docs', match: '/docs' }];
export const brand = { heading: 'Homeslate', href: '/' };

/** Order of the guide pages; everything else in `content/docs/*` is ignored by the Guides group. */
const GUIDES = ['index', 'getting-started', 'reference', 'self-hosting', 'releasing'];

/** Package order, shared by the Packages and API groups (matched on the first path segment after the group). */
const PACKAGES = [
  'schema',
  'google',
  'widgets',
  'editor',
  'display',
  'adapters',
  'server',
  'agent',
  'relay',
  'host-react',
];

const GROUPS = [
  { title: 'Guides', root: null },
  { title: 'Packages', root: 'packages' },
  { title: 'API', root: 'api' },
] as const;

const link = (id: string) => (id === 'index' ? '/docs' : `/docs/${id}`);

function groupOf(id: string): (typeof GROUPS)[number] {
  return GROUPS.find((g) => g.root && (id === g.root || id.startsWith(`${g.root}/`))) ?? GROUPS[0];
}

function rank(id: string): number {
  const [, pkg = ''] = id.split('/');
  const i = PACKAGES.indexOf(pkg);
  return id === 'packages' || id === 'api' ? -1 : i === -1 ? PACKAGES.length : i;
}

/** Sidebar and search index, derived from the `docs` collection so new pages show up without editing a list. */
export async function loadDocsNavigation(): Promise<{
  sidebarSections: SidebarSection[];
  searchItems: DocsSearchItem[];
}> {
  const entries = await getCollection('docs');
  const sorted = [...entries].sort((a, b) => {
    const ga = groupOf(a.id);
    const gb = groupOf(b.id);
    if (ga !== gb) return GROUPS.indexOf(ga) - GROUPS.indexOf(gb);
    if (!ga.root) return GUIDES.indexOf(a.id) - GUIDES.indexOf(b.id);
    return rank(a.id) - rank(b.id) || a.id.localeCompare(b.id);
  });

  const sidebarSections = GROUPS.map((group) => ({
    title: group.title,
    items: sorted
      .filter((e) => groupOf(e.id) === group && (group.root || GUIDES.includes(e.id)))
      .map((e) => ({
        // Section landing pages all carry a package-ish title; label them uniformly.
        text: e.id === 'index' || e.id === group.root ? 'Overview' : e.data.title,
        link: link(e.id),
      })),
  }));

  const searchItems = sorted.map((e) => {
    const group = groupOf(e.id).title;
    return {
      id: e.id === 'index' ? 'docs' : e.id,
      title: e.id === 'index' ? 'Overview' : e.data.title,
      meta: group,
      keywords: [...(e.data.keywords ?? []), ...(e.data.description ? [e.data.description] : [])],
      group,
    };
  });

  return { sidebarSections, searchItems };
}

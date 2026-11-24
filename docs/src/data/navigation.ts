import { getCollection, render } from 'astro:content';
import type { MarkdownHeading } from 'astro';
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

/** Headings that repeat on most pages; as search results they need the page name to mean anything. */
const GENERIC_HEADINGS = new Set([
  'usage',
  'also exported',
  'see also',
  'overview',
  'install',
  'installation',
  'example',
  'examples',
  'options',
  'notes',
  'related',
  'exports',
  'types',
  'functions',
]);

const link = (id: string) => (id === 'index' ? '/docs' : `/docs/${id}`);

function groupOf(id: string): (typeof GROUPS)[number] {
  return GROUPS.find((g) => g.root && (id === g.root || id.startsWith(`${g.root}/`))) ?? GROUPS[0];
}

function rank(id: string): number {
  const [, pkg = ''] = id.split('/');
  const i = PACKAGES.indexOf(pkg);
  return id === 'packages' || id === 'api' ? -1 : i === -1 ? PACKAGES.length : i;
}

const isOverview = (id: string) => id === 'index' || GROUPS.some((g) => g.root === id);
const overviewLabel = (group: (typeof GROUPS)[number]) => `${group.title} overview`;

/** Landing pages read "Guides overview" etc.; generated API pages drop the " API" suffix their group already says. */
function sidebarLabel(id: string, title: string, group: (typeof GROUPS)[number]): string {
  if (isOverview(id)) return overviewLabel(group);
  return group.root === 'api' ? title.replace(/ API$/, '') : title;
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
        text: sidebarLabel(e.id, e.data.title, group),
        link: link(e.id),
      })),
  }));

  // One search item per page plus one per section heading: a heading match opens `page#anchor` and
  // shows the page as its subtitle. The palette treats `id` as the link target. Guide and package
  // pages also index the start of each section's text so a body query ("sqlite") finds its section;
  // API pages index only their symbols (h3: functions, interfaces, types), not the h4+ members.
  const searchItems: DocsSearchItem[] = [];
  for (const e of sorted) {
    const group = groupOf(e.id);
    const page = e.id === 'index' ? '/docs' : `/docs/${e.id}`;
    const isApi = group.root === 'api';
    const sections = isApi ? [] : sectionText(e.body ?? '');
    const { headings } = await render(e);
    const intro = sections.find((s) => s.depth === 0)?.text ?? '';
    searchItems.push({
      id: page,
      title: isOverview(e.id) ? overviewLabel(group) : e.data.title,
      meta: e.data.description,
      keywords: [...(e.data.keywords ?? []), ...(intro ? [intro] : [])],
      group: group.title,
    });
    const bodies = new Map(sections.map((s) => [s.text0 ?? '', s.text]));
    for (const h of headings as MarkdownHeading[]) {
      if (h.depth < 2 || h.depth > 3) continue;
      if (isApi && h.depth !== 3) continue;
      const body = bodies.get(h.text) ?? '';
      // Generic headings ("Usage", "Also exported") say nothing out of context: lead with the page,
      // which also ranks them below a heading that is actually named after the query.
      const generic = GENERIC_HEADINGS.has(h.text.toLowerCase());
      searchItems.push({
        id: `${page}#${h.slug}`,
        title: generic ? `${e.data.title.replace(/ API$/, '')} \u00b7 ${h.text}` : h.text,
        meta: generic ? (e.data.description ?? group.title) : isApi ? e.data.title : sidebarLabel(e.id, e.data.title, group),
        keywords: body ? [body] : [],
        group: group.title,
      });
    }
  }

  return { sidebarSections, searchItems };
}

/** Plain text of each `##`/`###` section of a markdown body (first 300 chars), keyed by heading text; depth 0 is the intro. */
function sectionText(body: string): { depth: number; text0?: string; text: string }[] {
  const out: { depth: number; text0?: string; text: string }[] = [];
  let current: { depth: number; text0?: string; parts: string[] } = { depth: 0, parts: [] };
  const sections: (typeof current)[] = [current];
  let fence = false;
  for (const line of body.replace(/^---[\s\S]*?\n---\n/, '').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence;
      continue;
    }
    if (fence) continue;
    const h = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (h) {
      current = { depth: h[1].length, text0: h[2].replace(/[`*_]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'), parts: [] };
      sections.push(current);
    } else if (!/^\s*(import |export |<|\||#)/.test(line)) current.parts.push(line);
  }
  for (const s of sections) {
    const text = s.parts
      .join(' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*_>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);
    out.push({ depth: s.depth, text0: s.text0, text });
  }
  return out;
}

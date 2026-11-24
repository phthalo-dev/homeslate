import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Application } from "typedoc";

const docsRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const SOURCE_BASE = "https://github.com/phthalo-dev/homeslate/blob/main";
const apiDir = join(docsRoot, "content/docs/api");
const pluginPath = fileURLToPath(new URL("./typedoc-frontmatter.mjs", import.meta.url));

/** @typedef {{ id: string, entry: string, dest: string, title: string, description: string }} ApiEntry */

/** @type {ApiEntry[]} */
const ENTRIES = [
  {
    id: "schema",
    entry: "packages/schema/src/index.ts",
    dest: "api/schema.md",
    title: "@homeslate/schema",
    description: "Exports, types and signatures for @homeslate/schema.",
  },
  {
    id: "google",
    entry: "packages/google/src/index.ts",
    dest: "api/google.md",
    title: "@homeslate/google",
    description: "Exports, types and signatures for @homeslate/google.",
  },
  {
    id: "widgets",
    entry: "packages/widgets/src/index.ts",
    dest: "api/widgets.md",
    title: "@homeslate/widgets",
    description: "Exports, types and signatures for @homeslate/widgets.",
  },
  {
    id: "widgets-schemas",
    entry: "packages/widgets/src/schemas.ts",
    dest: "api/widgets/schemas.md",
    title: "@homeslate/widgets/schemas",
    description: "Exports, types and signatures for @homeslate/widgets/schemas.",
  },
  {
    id: "widgets-server",
    entry: "packages/widgets/src/server.ts",
    dest: "api/widgets/server.md",
    title: "@homeslate/widgets/server",
    description: "Exports, types and signatures for @homeslate/widgets/server.",
  },
  {
    id: "display",
    entry: "packages/display/src/index.ts",
    dest: "api/display.md",
    title: "@homeslate/display",
    description: "Exports, types and signatures for @homeslate/display.",
  },
  {
    id: "display-canvas",
    entry: "packages/display/src/canvas/index.ts",
    dest: "api/display/canvas.md",
    title: "@homeslate/display/canvas",
    description: "Exports, types and signatures for @homeslate/display/canvas.",
  },
  {
    id: "editor",
    entry: "packages/editor/src/index.ts",
    dest: "api/editor.md",
    title: "@homeslate/editor",
    description: "Exports, types and signatures for @homeslate/editor.",
  },
  {
    id: "adapters",
    entry: "packages/adapters/src/index.ts",
    dest: "api/adapters.md",
    title: "@homeslate/adapters",
    description: "Exports, types and signatures for @homeslate/adapters.",
  },
  {
    id: "server",
    entry: "packages/server/src/index.ts",
    dest: "api/server.md",
    title: "@homeslate/server",
    description: "Exports, types and signatures for @homeslate/server.",
  },
  {
    id: "agent",
    entry: "packages/agent/src/index.ts",
    dest: "api/agent.md",
    title: "@homeslate/agent",
    description: "Exports, types and signatures for @homeslate/agent.",
  },
  {
    id: "relay",
    entry: "packages/relay/src/index.ts",
    dest: "api/relay.md",
    title: "@homeslate/relay",
    description: "Exports, types and signatures for @homeslate/relay.",
  },
  {
    id: "host-react",
    entry: "packages/host-react/src/index.ts",
    dest: "api/host-react.md",
    title: "@homeslate/host-react",
    description: "Exports, types and signatures for @homeslate/host-react.",
  },
];

/**
 * Table rows already list every property, so a type alias or interface signature that is just an
 * inline object literal (a very long line, repeated below as a table) collapses to `object`.
 * @param {string[]} lines
 */
function collapseInlineObjects(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^(> \*\*[^*]+\*\* = )\\\{.*\\\}$/.exec(line);
    if (m && line.length > 100 && lines.slice(i, i + 12).some((l) => l.startsWith("| Property |"))) {
      out.push(`${m[1]}\`object\``);
    } else out.push(line);
  }
  return out;
}

/**
 * TypeDoc flattens nested object types into dotted rows (`data.colorMode.dark?`). Fold them into
 * their parent: the parent's `object` type lists its direct fields and the dotted rows go away.
 * Only rows whose parent row exists in the same table are folded.
 * @param {string[]} lines
 */
function foldNestedRows(lines) {
  const cellsOf = (line) => line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
  const nameOf = (cell) => cell.replace(/^`|`$/g, "").replace(/\?$/, "");
  const out = [];
  for (let i = 0; i < lines.length; ) {
    if (!(lines[i].startsWith("| ") && lines[i + 1]?.startsWith("| :--"))) {
      out.push(lines[i++]);
      continue;
    }
    let end = i + 2;
    while (end < lines.length && lines[end].startsWith("| ")) end++;
    const head = lines.slice(i, i + 2);
    const rows = lines.slice(i + 2, end).map((line) => ({ line, cells: cellsOf(line) }));
    const names = new Set(rows.map((r) => nameOf(r.cells[0] ?? "")));
    const parentOf = (n) => {
      const cut = n.lastIndexOf(".");
      return cut > 0 && names.has(n.slice(0, cut)) ? n.slice(0, cut) : null;
    };
    const children = new Map();
    for (const r of rows) {
      const raw = r.cells[0] ?? "";
      const parent = parentOf(nameOf(raw));
      if (parent) {
        const list = children.get(parent) ?? [];
        list.push(raw.replace(/^`[^`]*\./, "`"));
        children.set(parent, list);
      }
    }
    out.push(...head);
    for (const r of rows) {
      const name = nameOf(r.cells[0] ?? "");
      if (parentOf(name)) continue;
      const kids = children.get(name);
      if (kids && /^`object`(\[\])?$/.test(r.cells[1] ?? "")) {
        const cells = [...r.cells];
        cells[1] = `${cells[1]} with ${kids.join(", ")}`;
        out.push(`| ${cells.join(" | ")} |`);
      } else out.push(r.line);
    }
    i = end;
  }
  return out;
}

/**
 * Drop any table column whose cells are all empty (a "Description" column on an undocumented
 * interface), so narrow screens spend their width on the name and type.
 * @param {string[]} lines
 */
function dropEmptyColumns(lines) {
  const cellsOf = (line) => line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
  const out = [];
  for (let i = 0; i < lines.length; ) {
    if (!(lines[i].startsWith("| ") && lines[i + 1]?.startsWith("| :--"))) {
      out.push(lines[i++]);
      continue;
    }
    let end = i + 2;
    while (end < lines.length && lines[end].startsWith("| ")) end++;
    const rows = lines.slice(i, end).map(cellsOf);
    const body = rows.slice(2);
    const keep = rows[0].map((_, c) => body.length === 0 || body.some((r) => !["", "-"].includes(r[c] ?? "")));
    for (const [n, cells] of rows.entries()) {
      const kept = cells.filter((_, c) => keep[c]);
      out.push(`| ${kept.join(" | ")} |`);
    }
    i = end;
  }
  return out;
}

/**
 * "Most-used exports" for the page intro: the symbols other symbols on the page link to most, with
 * the first line of their description where the source has JSDoc.
 * @param {string} body
 */
function mostUsed(body) {
  const sections = body.split(/\n---\n\n(?=### )/).slice(1);
  const info = new Map();
  for (const sec of sections) {
    const name = /^### (.+)$/m.exec(sec)?.[1]?.trim();
    if (!name) continue;
    const desc = sec
      .split("\n")
      .slice(1)
      .find((l) => l.trim() && !/^(Defined in|>|\||#|-|\*|`|\\|<)/.test(l.trim()));
    info.set(name, { count: 0, desc: desc?.trim().replace(/\s+/g, " ") });
  }
  for (const m of body.matchAll(/\]\(#([a-z0-9-]+)\)/g)) {
    for (const [name, v] of info) if (name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === m[1]) v.count++;
  }
  const top = [...info.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, 6);
  if (top.length < 3) return "";
  const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    "\n**Most-referenced exports**\n\n" +
    top
      .map(([n, v]) => `- [\`${n}\`](#${slug(n)})${v.desc ? `: ${v.desc.replace(/[.]$/, "")}` : ""}`)
      .join("\n") +
    "\n"
  );
}

function listMarkdownFiles(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listMarkdownFiles(path));
    else if (entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

function pickMarkdown(tmpDir) {
  const nestedIndex = listMarkdownFiles(tmpDir).find((path) => path.endsWith("/index.md"));
  if (nestedIndex) return nestedIndex;
  const files = listMarkdownFiles(tmpDir);
  if (files.length !== 1) {
    console.error(`Expected one markdown file in ${tmpDir}, found ${files.length}:`);
    for (const file of files) console.error(`  ${file}`);
    process.exit(1);
  }
  return files[0];
}

function hasTitleFrontmatter(path) {
  return /^---\r?\n[\s\S]*?^title:/m.test(readFileSync(path, "utf8"));
}

/**
 * Add an intro and visual separation to a generated page: a lead paragraph linking to the package
 * guide, and a rule before every member heading (outside code fences) so long pages scan.
 * @param {string} dest
 * @param {ApiEntry} row
 */
function decorate(dest, row) {
  const text = readFileSync(dest, "utf8");
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(text);
  const frontmatter = match ? match[0] : "";
  const guide = row.id.split("-")[0];
  const intro =
    `\nGenerated from the TypeScript sources of \`${row.title}\`; each symbol links to its source on ` +
    `GitHub. For usage, see the [${guide} package guide](/docs/packages/${guide}).\n`;
  let inFence = false;
  const unfolded = collapseInlineObjects(
    text
      .slice(frontmatter.length)
      .split("\n")
      .map((line) => {
        if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
        if (inFence) return line;
        // Drop TypeDoc's own rule (we add one per symbol) and the redundant "Properties" subheading.
        if (line === "***" || line === "#### Properties") return null;
        return line.startsWith('### ') ? `---\n\n${line}` : line;
      })
      .filter((line) => line !== null),
  )
    .join("\n")
    // Every interface that extends WidgetConfig repeats its index signature; it is noise.
    .replace(/#### Indexable\n\n> \\\[`key`: `string`\\\]: `unknown`\n\n?/g, "")
    // Table rows carry a hidden anchor per property; nothing links to them.
    .replace(/<a id="[^"]*"><\/a> ?/g, "")
    // TypeDoc's {path} is relative to the entry directory when git is disabled, so rebuild each
    // link from the link text, which carries the repository-relative path.
    .replace(
      /\[(packages\/[^\]:\s]+):(\d+)\]\([^)]*\)/g,
      (_, file, line) => `[${file.split("/").pop()}:${line}](${SOURCE_BASE}/${file}#L${line})`,
    );
  const body = dropEmptyColumns(foldNestedRows(unfolded.split("\n"))).join("\n");
  writeFileSync(dest, `${frontmatter}${intro}${mostUsed(body)}\n${body}`);
}

async function generateOne(row) {
  const tmp = join(apiDir, ".tmp", row.id);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  process.env.HOMESLATE_API_TITLE = row.title;
  process.env.HOMESLATE_API_DESCRIPTION = row.description;

  const app = await Application.bootstrapWithPlugins({
    entryPoints: [join(repoRoot, row.entry)],
    tsconfig: join(repoRoot, "tsconfig.app.json"),
    plugin: ["typedoc-plugin-markdown", "typedoc-plugin-frontmatter", pluginPath],
    out: tmp,
    readme: "none",
    exclude: ["**/*.test.ts"],
    skipErrorChecking: true,
    hideGenerator: true,
    entryFileName: "index.md",
    outputFileStrategy: "modules",
    hidePageHeader: true,
    hideBreadcrumbs: true,
    hidePageTitle: true,
    // Compact output: members as tables (one row per property, no per-member "Defined in"),
    // nested object types expanded into extra rows, and no "Properties"/"Methods" sub-headings.
    propertiesFormat: "table",
    interfacePropertiesFormat: "table",
    classPropertiesFormat: "table",
    typeDeclarationFormat: "table",
    parametersFormat: "table",
    enumMembersFormat: "table",
    expandObjects: false,
    hideGroupHeadings: false,
    tableColumnSettings: { hideSources: true, hideModifiers: true, leftAlignHeaders: true },
    // "Defined in" lines become links to the source on GitHub. Pinned to `main` so links survive
    // rebuilds; paths are relative to the repository root.
    basePath: repoRoot,
    disableGit: true,
    gitRevision: "main",
    sourceLinkTemplate: `${SOURCE_BASE}/{path}#L{line}`,
  });

  const project = await app.convert();
  if (!project) {
    console.error(`TypeDoc convert failed for ${row.entry}`);
    process.exit(1);
  }
  await app.generateOutputs(project);

  const dest = join(docsRoot, "content/docs", row.dest);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(pickMarkdown(tmp), dest);
  decorate(dest, row);
  rmSync(tmp, { recursive: true, force: true });
}

async function main() {
  rmSync(apiDir, { recursive: true, force: true });
  mkdirSync(apiDir, { recursive: true });
  for (const row of ENTRIES) await generateOne(row);
  rmSync(join(apiDir, ".tmp"), { recursive: true, force: true });
  for (const row of ENTRIES) {
    const dest = join(docsRoot, "content/docs", row.dest);
    if (!existsSync(dest)) {
      console.error(`Missing generated API page: ${dest}`);
      process.exit(1);
    }
    if (!hasTitleFrontmatter(dest)) {
      console.error(`Generated API page is missing title frontmatter: ${dest}`);
      process.exit(1);
    }
  }
}

await main();

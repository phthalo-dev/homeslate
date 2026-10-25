import type { ThemeDocument } from "@homeslate/schema";

type Tree = Record<string, unknown>;
type ModeLeaf = { light?: string; dark?: string };

const isTree = (value: unknown): value is Tree =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/** A `{ light, dark }` token leaf (either side may be missing). */
const isModeLeaf = (value: unknown): value is ModeLeaf =>
  isTree(value) &&
  Object.keys(value).length > 0 &&
  Object.entries(value).every(
    ([key, v]) => (key === "light" || key === "dark") && typeof v === "string",
  );

function zipColors(base: unknown, light: unknown, dark: unknown): Tree {
  const out: Tree = {};
  const keys = new Set<string>();
  for (const tree of [base, light, dark])
    if (isTree(tree)) Object.keys(tree).forEach((k) => keys.add(k));

  for (const key of keys) {
    const b = isTree(base) ? base[key] : undefined;
    const l = isTree(light) ? light[key] : undefined;
    const d = isTree(dark) ? dark[key] : undefined;

    const isGroup = [b, l, d].every((v) => v === undefined || (isTree(v) && !isModeLeaf(v)));
    if (isGroup) {
      out[key] = zipColors(b, l, d);
      continue;
    }

    // A plain base color applies to light only: in dark mode the preset's own dark value used to
    // win over it, and a missing side now inherits from the parent theme.
    const lightValue =
      (typeof l === "string" ? l : undefined) ??
      (typeof b === "string" ? b : isModeLeaf(b) ? b.light : undefined);
    const darkValue =
      (typeof d === "string" ? d : undefined) ?? (isModeLeaf(b) ? b.dark : undefined);

    const leaf: ModeLeaf = {};
    if (lightValue !== undefined) leaf.light = lightValue;
    if (darkValue !== undefined) leaf.dark = darkValue;
    if (leaf.light !== undefined || leaf.dark !== undefined) out[key] = leaf;
  }
  return out;
}

function mergeTrees(target: Tree, source: Tree): Tree {
  const out: Tree = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = out[key];
    out[key] =
      isTree(existing) && isTree(value) && !isModeLeaf(value) ? mergeTrees(existing, value) : value;
  }
  return out;
}

/**
 * Convert a theme document into `tokens` for `defaultTheme.override({ name, tokens })`.
 *
 * var-ui 0.2 has no `colorMode` or `extend` options: light/dark values live on `{ light, dark }`
 * leaves inside `tokens`, and custom namespaces are just more `tokens`. A leaf with only one side
 * inherits the other from the parent theme, which is what a `colorMode` patch used to mean.
 */
export function toDesignThemeTokens(
  doc: Pick<ThemeDocument, "tokens" | "colorMode" | "extend">,
): Tree {
  const { color: baseColor, ...restTokens } = (isTree(doc.tokens) ? doc.tokens : {}) as Tree;
  const color = zipColors(baseColor, doc.colorMode?.light, doc.colorMode?.dark);
  const extend = (isTree(doc.extend) ? doc.extend : {}) as Tree;
  const tokens = mergeTrees(restTokens, extend);
  return Object.keys(color).length > 0 ? { ...tokens, color } : tokens;
}

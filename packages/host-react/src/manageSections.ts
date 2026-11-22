export type ManageSection = "views" | "settings" | "theme";

/** The display management sections, in nav order. `path` is relative to `/edit/:id`. */
export const MANAGE_SECTIONS: ReadonlyArray<{ id: ManageSection; label: string; path: string }> = [
  { id: "views", label: "Views", path: "" },
  { id: "settings", label: "Settings", path: "/settings" },
  { id: "theme", label: "Theme", path: "/theme" },
];

/** Which management section a pathname under `/edit/:id` belongs to. */
export function sectionFromPath(pathname: string): ManageSection {
  if (pathname.endsWith("/settings")) return "settings";
  if (pathname.endsWith("/theme")) return "theme";
  return "views";
}

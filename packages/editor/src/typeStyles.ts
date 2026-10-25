import { createTypeStyles } from "typestyles";

const api = createTypeStyles({
  scopeId: "@homeslate/editor",
  mode: "hashed",
});

/**
 * `styles.class(name, properties)` is the pre-0.29 spelling of typestyles' `style(name, properties)`.
 * Kept as a thin alias so the stylesheet modules did not all need to change at once.
 */
export const styles = { class: api.style };
export const { recipe } = api;

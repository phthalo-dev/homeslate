import { createTypeStyles } from "typestyles";

const api = createTypeStyles({
  scopeId: "@homeslate/host-react",
  mode: "hashed",
});

/** `styles.class(name, properties)` mirrors the other homeslate packages. */
export const styles = { class: api.style };
export const { global } = api;

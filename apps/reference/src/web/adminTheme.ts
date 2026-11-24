import { defaultTheme } from "@var-ui/core";

const ALLO_STACK =
  '"Allo", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** The admin chrome: VarUI's default surface set in Allo (https://allo.joshpuckett.me). */
export const adminTheme = defaultTheme.override({
  name: "homeslate-admin",
  tokens: {
    fontFamily: { body: ALLO_STACK, display: ALLO_STACK },
  },
});

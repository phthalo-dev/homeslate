import { variant } from "typestyles";
import { recipe } from "../typeStyles";

export const clock = recipe({
  name: "clock",
  slots: ["root", "time", "date"] as const,
  variants: { transparent: variant.boolean({ default: false }) },
  styles: {
    base: {
      root: {
        width: "100%",
        minHeight: 0,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--var-ui-color-tone-accent-foreground) 10%, transparent) 0%, color-mix(in srgb, var(--var-ui-color-tone-accent-foreground) 5%, transparent) 100%)",
        borderRadius: "var(--var-ui-widget-radius, var(--var-ui-radius-md))",
      },
      time: {
        fontFamily: '"JetBrains Mono", "Space Mono", "SF Mono", monospace',
        fontWeight: 300,
        letterSpacing: "0.05em",
        lineHeight: 1,
        color: "var(--var-ui-color-text-primary)",
        textShadow: "0 0 40px var(--var-ui-color-ring-default)",
      },
      date: {
        fontWeight: 500,
        color: "var(--var-ui-color-text-secondary)",
        textTransform: "capitalize",
        marginTop: "0.4em",
      },
    },
    variants: {
      transparent: {
        true: { root: { background: "transparent" } },
        false: {},
      },
    },
  },
});

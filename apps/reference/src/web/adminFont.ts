import { createTypeStyles } from "typestyles";

/**
 * Allo 1.0.3 (SIL Open Font License 1.1; license in public/fonts/allo/OFL.txt, https://allo.joshpuckett.me):
 * the variable font plus the nine obliques, served from `public/`. Static URLs keep this module safe
 * for the typestyles extract entry, which is evaluated in Node.
 */
const { global } = createTypeStyles({ scopeId: "@homeslate/reference-fonts", mode: "hashed" });

const face = (file: string, fontWeight: string | number, fontStyle: "normal" | "italic") =>
  global.fontFace("Allo", {
    src: `url("/fonts/allo/${file}") format("woff2")`,
    fontWeight,
    fontStyle,
    fontDisplay: "swap",
  });

face("AlloVariable.woff2", "100 900", "normal");
face("Allo-ThinOblique.woff2", 100, "italic");
face("Allo-ExtraLightOblique.woff2", 200, "italic");
face("Allo-LightOblique.woff2", 300, "italic");
face("Allo-Oblique.woff2", 400, "italic");
face("Allo-MediumOblique.woff2", 500, "italic");
face("Allo-SemiBoldOblique.woff2", 600, "italic");
face("Allo-BoldOblique.woff2", 700, "italic");
face("Allo-ExtraBoldOblique.woff2", 800, "italic");
face("Allo-BlackOblique.woff2", 900, "italic");

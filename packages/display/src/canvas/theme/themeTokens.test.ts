import { describe, expect, it } from "vite-plus/test";
import { toDesignThemeTokens } from "./themeTokens";

describe("toDesignThemeTokens", () => {
  it("returns an empty tree for an empty document", () => {
    expect(toDesignThemeTokens({})).toEqual({});
  });

  it("puts colorMode light and dark values on the same leaf", () => {
    expect(
      toDesignThemeTokens({
        colorMode: {
          light: { background: { app: "#ffffff" } },
          dark: { background: { app: "#000000" } },
        },
      }),
    ).toEqual({ color: { background: { app: { light: "#ffffff", dark: "#000000" } } } });
  });

  it("leaves the missing side out so it inherits from the parent theme", () => {
    const tokens = toDesignThemeTokens({
      colorMode: { light: { tone: { accent: { foreground: "#111111" } } } },
    });
    expect(tokens).toEqual({ color: { tone: { accent: { foreground: { light: "#111111" } } } } });
  });

  it("treats a plain base color as the light value, with colorMode able to override each side", () => {
    expect(
      toDesignThemeTokens({
        tokens: { color: { text: { primary: "#222222", secondary: "#333333" } } },
        colorMode: { dark: { text: { primary: "#eeeeee" } } },
      }),
    ).toEqual({
      color: {
        text: {
          primary: { light: "#222222", dark: "#eeeeee" },
          secondary: { light: "#333333" },
        },
      },
    });
  });

  it("keeps inline { light, dark } base leaves and lets colorMode override them", () => {
    expect(
      toDesignThemeTokens({
        tokens: { color: { border: { default: { light: "#aaaaaa", dark: "#555555" } } } },
        colorMode: { dark: { border: { default: "#777777" } } },
      }),
    ).toEqual({ color: { border: { default: { light: "#aaaaaa", dark: "#777777" } } } });
  });

  it("passes other token namespaces through and merges extend namespaces into tokens", () => {
    expect(
      toDesignThemeTokens({
        tokens: { radius: { md: "12px" } },
        extend: {
          canvas: { backgroundImage: { light: "linear-gradient(red, blue)", dark: "none" } },
        },
      }),
    ).toEqual({
      radius: { md: "12px" },
      canvas: { backgroundImage: { light: "linear-gradient(red, blue)", dark: "none" } },
    });
  });
});

import { describe, expect, it } from "vite-plus/test";
import { getRegisteredCss } from "typestyles";
import { container } from "./canvas/DocumentCanvas.styles";
import { dots, root } from "./Display.styles";

describe("display root layout", () => {
  it("keeps the canvas filling the kiosk without flexing every other child", () => {
    void root;
    void container;
    const css = getRegisteredCss();
    const escapedDots = dots.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    expect(css).not.toMatch(new RegExp(`:not\\(\\.${escapedDots}\\)[^{]*\\{[^}]*flex:\\s*1`));
    expect(css).toMatch(new RegExp(`\\.${container}[^{]*\\{[^}]*flex:\\s*1`));
    expect(css).toMatch(new RegExp(`\\.${container}[^{]*\\{[^}]*min-height:\\s*0`));
  });
});

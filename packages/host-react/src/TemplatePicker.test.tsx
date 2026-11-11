import { renderToStaticMarkup } from "react-dom/server";
import type { DisplayDocument } from "@homeslate/schema";
import { DOCUMENT_TEMPLATES, documentForNewDisplay } from "@homeslate/display/canvas";
import { describe, expect, it } from "vite-plus/test";
import { TemplatePickerChoices } from "./TemplatePicker";

describe("TemplatePicker", () => {
  it("lists Blank and every starter template", () => {
    const html = renderToStaticMarkup(
      <TemplatePickerChoices loading={false} onCreate={() => {}} />,
    );
    expect(html).toContain("Blank");
    for (const template of DOCUMENT_TEMPLATES) {
      expect(html).toContain(template.name);
      expect(html).toContain(template.description);
    }
  });

  it("creates a new display document for the chosen template", () => {
    const created: DisplayDocument[] = [];
    const html = renderToStaticMarkup(
      <TemplatePickerChoices loading={false} onCreate={(document) => created.push(document)} />,
    );
    expect(html).toContain("Family Hub");
    const family = documentForNewDisplay("family-hub");
    expect(family.name).toBe("Family Hub");
    expect(family.views[0].widgets.map((widget) => widget.type)).toEqual([
      "clock",
      "weather",
      "calendar",
      "grocery",
      "chores",
      "photo",
    ]);
    expect(documentForNewDisplay("blank").name).toBe("Homeslate");
    expect(created).toEqual([]);
  });
});

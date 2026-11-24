import { MarkdownPageEvent } from "typedoc-plugin-markdown";

/** @param {import("typedoc-plugin-markdown").MarkdownApplication} app */
export function load(app) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    page.frontmatter = {
      ...page.frontmatter,
      title: `${process.env.HOMESLATE_API_TITLE} API`,
      eyebrow: "API",
      description: process.env.HOMESLATE_API_DESCRIPTION,
    };
  });
}

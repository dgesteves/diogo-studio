import type { ArticleBlock } from "@/content/schema/article-blocks";
import { stripInlineMarkup } from "@/lib/content/parse-inline";
import { slugifyHeading } from "@/lib/content/slugify-heading";

import type { RawSection } from "./types";

function proseText(block: ArticleBlock): string {
  switch (block.kind) {
    case "heading":
      return block.level === 3 ? block.text : "";
    case "paragraph":
    case "quote":
      return stripInlineMarkup(block.text);
    case "list":
      return block.items.map((item) => `- ${stripInlineMarkup(item)}`).join("\n");
    default:
      return "";
  }
}

export function articleSections(blocks: readonly ArticleBlock[]): RawSection[] {
  const sections: RawSection[] = [];
  let current: RawSection = { body: "" };
  for (const block of blocks) {
    if (block.kind === "heading" && block.level === 2) {
      if (current.body.trim()) sections.push(current);
      current = { heading: block.text, anchor: slugifyHeading(block.text), body: "" };
      continue;
    }
    const text = proseText(block);
    if (text) current.body += `${text}\n\n`;
  }
  if (current.body.trim()) sections.push(current);
  return sections;
}

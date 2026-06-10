import type { ArticleBlock } from "@/content/schema/article-blocks";
import type { TocItem } from "@/content/schema/toc";
import { slugifyHeading } from "./slugify-heading";

export function deriveToc(blocks: readonly ArticleBlock[]): TocItem[] {
  const root: TocItem[] = [];
  let currentSection: TocItem | undefined;
  for (const block of blocks) {
    if (block.kind !== "heading") continue;
    const item: TocItem = {
      title: block.text,
      url: `#${slugifyHeading(block.text)}`,
      items: [],
    };
    if (block.level === 2 || !currentSection) {
      root.push(item);
      currentSection = item;
    } else {
      currentSection.items?.push(item);
    }
  }
  return root;
}

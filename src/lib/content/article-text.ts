import type { ArticleBlock } from "@/content/schema/article-blocks";
import { stripInlineMarkup } from "./parse-inline";

export function blockText(block: ArticleBlock): string {
  switch (block.kind) {
    case "heading":
      return block.text;
    case "paragraph":
    case "quote":
      return stripInlineMarkup(block.text);
    case "list":
      return block.items.map(stripInlineMarkup).join("\n");
    case "callout":
      return joinParts(block.title, stripInlineMarkup(block.body));
    case "tradeoff":
      return joinParts(block.title, stripInlineMarkup(block.gained), stripInlineMarkup(block.paid));
    case "outcome":
      return joinParts(block.tag, stripInlineMarkup(block.body));
    case "stack":
      return joinParts(block.label, block.items.join(", "));
    case "metrics":
      return block.items
        .map((item) => joinParts(item.label, item.value, item.unit, item.hint))
        .join("\n");
    case "diagram":
      return joinParts(block.title, block.description, block.caption);
    case "timeline":
      return block.phases
        .map((phase) =>
          joinParts(phase.tag, phase.title, phase.dates, stripInlineMarkup(phase.body)),
        )
        .join("\n");
    case "decisions":
      return block.items
        .map((item) =>
          joinParts(
            item.title,
            stripInlineMarkup(item.constraint),
            stripInlineMarkup(item.options),
            stripInlineMarkup(item.choice),
            stripInlineMarkup(item.outcome),
          ),
        )
        .join("\n");
  }
}

export function articleText(blocks: readonly ArticleBlock[]): string {
  return blocks.map(blockText).join("\n");
}

function joinParts(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

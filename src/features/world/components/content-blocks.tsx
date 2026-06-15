import { type ReactElement } from "react";
import type { ContentBlock } from "../types";
import { CardsBlock, LinksBlock, StatsBlock, TimelineBlock } from "./content-rich-blocks";

export function ContentBlocks({ blocks }: { blocks: readonly ContentBlock[] }): ReactElement {
  return (
    <div className="flex flex-col gap-8">
      {blocks.map((block, index) => (
        <BlockView key={`${block.kind}-${index}`} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: ContentBlock }): ReactElement {
  switch (block.kind) {
    case "lede":
      return (
        <p className="text-muted-foreground text-lg leading-relaxed text-balance">{block.text}</p>
      );
    case "prose":
      return (
        <div className="flex flex-col gap-4">
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      );
    case "list":
      return (
        <div className="flex flex-col gap-3">
          {block.title ? (
            <h2 className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
              {block.title}
            </h2>
          ) : null}
          <ul className="flex flex-col gap-2">
            {block.items.map((item) => (
              <li key={item} className="text-muted-foreground flex gap-2.5 text-sm leading-relaxed">
                <span
                  aria-hidden="true"
                  className="text-accent mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-current"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "stats":
      return <StatsBlock items={block.items} />;
    case "cards":
      return <CardsBlock items={block.items} />;
    case "timeline":
      return <TimelineBlock items={block.items} />;
    case "links":
      return <LinksBlock items={block.items} />;
    default: {
      const exhaustive: never = block;
      throw new Error(`Unhandled content block: ${JSON.stringify(exhaustive)}`);
    }
  }
}

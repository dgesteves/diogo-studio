import type { ReactElement } from "react";
import type { ArticleBlock } from "@/content/schema/article-blocks";
import { ArticleDecisions } from "./article-decisions";
import { ArticleHeading } from "./article-heading";
import { ArticleMetrics } from "./article-metrics";
import { ArticleList, ArticleParagraph, ArticleQuote } from "./article-prose";
import { ArticleTimeline } from "./article-timeline";
import { Callout } from "./callout";
import { Outcome } from "./outcome";
import { RichText } from "./rich-text";
import { StackList } from "./stack-list";
import { SystemDiagram } from "./system-diagram";
import { Tradeoff } from "./tradeoff";

function ArticleBlockView({ block }: { block: ArticleBlock }): ReactElement {
  switch (block.kind) {
    case "heading":
      return <ArticleHeading level={block.level} text={block.text} />;
    case "paragraph":
      return <ArticleParagraph text={block.text} />;
    case "list":
      return <ArticleList items={block.items} />;
    case "quote":
      return <ArticleQuote text={block.text} />;
    case "callout":
      return (
        <Callout tone={block.tone} title={block.title}>
          <RichText text={block.body} />
        </Callout>
      );
    case "tradeoff":
      return (
        <Tradeoff
          title={block.title}
          gained={<RichText text={block.gained} />}
          paid={<RichText text={block.paid} />}
        />
      );
    case "outcome":
      return (
        <Outcome tag={block.tag}>
          <RichText text={block.body} />
        </Outcome>
      );
    case "stack":
      return <StackList label={block.label} items={block.items} />;
    case "metrics":
      return <ArticleMetrics items={block.items} />;
    case "diagram":
      return (
        <SystemDiagram
          title={block.title}
          description={block.description}
          caption={block.caption}
          data={block.data}
        />
      );
    case "timeline":
      return <ArticleTimeline phases={block.phases} />;
    case "decisions":
      return <ArticleDecisions items={block.items} />;
  }
}

export function ArticleBlocks({ blocks }: { blocks: readonly ArticleBlock[] }): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, index) => (
        <ArticleBlockView key={index} block={block} />
      ))}
    </div>
  );
}

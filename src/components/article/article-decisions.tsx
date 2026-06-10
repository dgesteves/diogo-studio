import type { ReactElement } from "react";
import type { DecisionItem } from "@/content/schema/article-blocks";
import { Decision, DecisionsLog } from "./decisions-log";
import { RichText } from "./rich-text";

export function ArticleDecisions({ items }: { items: readonly DecisionItem[] }): ReactElement {
  return (
    <DecisionsLog>
      {items.map((item) => (
        <Decision
          key={item.title}
          index={item.index}
          title={item.title}
          constraint={<RichText text={item.constraint} />}
          options={<RichText text={item.options} />}
          choice={<RichText text={item.choice} />}
          outcome={<RichText text={item.outcome} />}
        />
      ))}
    </DecisionsLog>
  );
}

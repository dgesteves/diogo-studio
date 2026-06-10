import type { ReactElement } from "react";
import type { MetricItem } from "@/content/schema/article-blocks";
import { MetricGrid, MetricTile } from "./metric-tile";
import { Sparkline } from "./sparkline";

export function ArticleMetrics({ items }: { items: readonly MetricItem[] }): ReactElement {
  return (
    <MetricGrid>
      {items.map((item) => (
        <MetricTile
          key={item.label}
          label={item.label}
          value={item.value}
          unit={item.unit}
          hint={item.hint}
          tone={item.tone}
        >
          {item.sparkline ? (
            <Sparkline
              values={item.sparkline.values}
              tone={item.sparkline.tone}
              ariaLabel={item.sparkline.ariaLabel}
            />
          ) : null}
        </MetricTile>
      ))}
    </MetricGrid>
  );
}

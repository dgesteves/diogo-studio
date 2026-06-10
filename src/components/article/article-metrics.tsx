import type { ReactElement } from "react";
import type { HeadlineMetric } from "@/content/schema/article";
import { MetricGrid, MetricTile } from "./metric-tile";

export function ArticleMetrics({ items }: { items: readonly HeadlineMetric[] }): ReactElement {
  return (
    <MetricGrid>
      {items.map((item) => (
        <MetricTile
          key={item.label}
          label={item.label}
          value={item.value}
          unit={item.unit}
          hint={item.hint}
        />
      ))}
    </MetricGrid>
  );
}

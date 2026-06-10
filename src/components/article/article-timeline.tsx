import type { ReactElement } from "react";
import type { TimelinePhase } from "@/content/schema/article-blocks";
import { RichText } from "./rich-text";
import { Phase, Timeline } from "./timeline";

export function ArticleTimeline({ phases }: { phases: readonly TimelinePhase[] }): ReactElement {
  return (
    <Timeline>
      {phases.map((phase) => (
        <Phase key={phase.tag} tag={phase.tag} title={phase.title} dates={phase.dates}>
          <RichText text={phase.body} />
        </Phase>
      ))}
    </Timeline>
  );
}

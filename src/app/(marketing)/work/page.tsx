import type { Metadata } from "next";
import type { ReactElement } from "react";
import { caseStudies } from "#content";
import { routes } from "@/config/routes";
import { CaseStudyCard } from "@/components/common/case-study-card";
import { ContentEmptyState } from "@/components/common/content-empty-state";
import { ContentIndexHeader } from "@/components/common/content-index-header";
import { PatternFilter } from "@/components/common/pattern-filter";
import { parsePatternIds } from "@/content/data/patterns";
import { collectPatterns, filterByPattern } from "@/lib/content/filter-by-pattern";
import { sortPublished } from "@/lib/content/sort-published";

export const metadata: Metadata = {
  title: "Case studies",
  description:
    "Telemetry-dashboard case studies on AI-native platforms, design-system infrastructure, streaming-grade reliability, and agentic UX.",
  alternates: { canonical: routes.work },
};

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string | string[] }>;
}): Promise<ReactElement> {
  const { p } = await searchParams;
  const selected = parsePatternIds(p);
  const ordered = sortPublished(caseStudies);
  const visible = filterByPattern(ordered, selected);
  const availablePatterns = collectPatterns(ordered);

  return (
    <section
      role="region"
      aria-labelledby="work-heading"
      className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-20 pb-32 sm:px-6 lg:px-8"
    >
      <ContentIndexHeader
        eyebrow={`Case studies · ${ordered.length} engagements`}
        headingId="work-heading"
        title="Postmortems, not marketing pages."
        intro="Each engagement gets rendered like a telemetry dashboard — scale metrics, system diagrams, decisions log, tradeoffs, outcomes. Filter by the patterns that matter to your bar."
      >
        <PatternFilter available={availablePatterns} selected={selected} />
      </ContentIndexHeader>

      {visible.length === 0 ? (
        <ContentEmptyState message="No case studies match the current filter. Reset to see all engagements." />
      ) : (
        <ol className="flex flex-col gap-5">
          {visible.map((study) => (
            <CaseStudyCard key={study.slug} study={study} />
          ))}
        </ol>
      )}
    </section>
  );
}

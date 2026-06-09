import type { Metadata } from "next";
import type { ReactElement } from "react";
import { essays } from "#content";
import { ContentEmptyState } from "@/components/common/content-empty-state";
import { ContentIndexHeader } from "@/components/common/content-index-header";
import { EssayCard } from "@/components/common/essay-card";
import { PatternFilter } from "@/components/common/pattern-filter";
import { parsePatternIds } from "@/content/data/career-graph";
import { collectPatterns, filterByPattern } from "@/lib/content/filter-by-pattern";
import { sortPublished } from "@/lib/content/sort-published";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays on platform engineering, AI-native UX, and design-system infrastructure.",
  alternates: { canonical: "/writing" },
};

export default async function WritingPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string | string[] }>;
}): Promise<ReactElement> {
  const { p } = await searchParams;
  const selected = parsePatternIds(p);
  const ordered = sortPublished(essays);
  const visible = filterByPattern(ordered, selected);
  const availablePatterns = collectPatterns(ordered);

  return (
    <section
      role="region"
      aria-labelledby="writing-heading"
      className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-20 pb-32 sm:px-6 lg:px-8"
    >
      <ContentIndexHeader
        eyebrow={`Writing · ${ordered.length} essays`}
        headingId="writing-heading"
        title="Opinionated takes on the patterns this site embodies."
        intro="What I think about design systems, agentic UX, streaming-grade reliability, and the operating habits that distinguish a senior engagement from a junior one."
      >
        <PatternFilter available={availablePatterns} selected={selected} />
      </ContentIndexHeader>

      {visible.length === 0 ? (
        <ContentEmptyState message="No essays match the current filter. Reset to see all writing." />
      ) : (
        <ol className="flex flex-col gap-2">
          {visible.map((essay) => (
            <EssayCard key={essay.slug} essay={essay} />
          ))}
        </ol>
      )}
    </section>
  );
}

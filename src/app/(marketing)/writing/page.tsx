import type { Metadata } from "next";
import type { ReactElement } from "react";
import { essays } from "#content";
import { EssayCard } from "@/components/common/essay-card";
import { PatternFilter } from "@/components/common/pattern-filter";
import { StatusDot } from "@/components/ui/status-dot";
import { parsePatternIds, type PatternId } from "@/content/data/career-graph";

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

  const ordered = [...essays]
    .filter((e) => !e.draft)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return b.publishedAt.localeCompare(a.publishedAt);
    });

  const visible =
    selected.length === 0
      ? ordered
      : ordered.filter((e) => selected.some((p) => e.patterns.includes(p as PatternId)));

  const availablePatterns = Array.from(new Set(ordered.flatMap((e) => e.patterns))) as PatternId[];

  return (
    <section
      role="region"
      aria-labelledby="writing-heading"
      className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-20 pb-32 sm:px-6 lg:px-8"
    >
      <header className="flex flex-col gap-6">
        <div className="border-border bg-surface text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
          <StatusDot tone="good" />
          <span>Writing · {ordered.length} essays</span>
        </div>
        <h1
          id="writing-heading"
          className="text-foreground text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.05] font-medium tracking-tight text-balance"
        >
          Opinionated takes on the patterns this site embodies.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
          What I think about design systems, agentic UX, streaming-grade reliability, and the
          operating habits that distinguish a senior engagement from a junior one.
        </p>
        <PatternFilter available={availablePatterns} selected={selected} />
      </header>

      {visible.length === 0 ? (
        <div className="border-border bg-surface text-muted-foreground rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm leading-relaxed">
            No essays match the current filter. Reset to see all writing.
          </p>
        </div>
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

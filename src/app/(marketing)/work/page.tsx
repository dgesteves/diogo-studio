import type { Metadata } from "next";
import { caseStudies } from "#content";
import { CaseStudyCard } from "@/components/site/case-study-card";
import { PatternFilter } from "@/components/site/pattern-filter";
import { StatusDot } from "@/components/ui/status-dot";
import { type PatternId } from "@/content/data/career-graph";

/**
 * `/work` — telemetry-dashboard index of every published case study.
 *
 * Server-rendered list, ordered by the schema's `order` field (so we can
 * promote flagship engagements without depending on dates). A pattern
 * filter strip pushes selections into the URL (`?p=ai-native`) which
 * we read here on the server — no client-side filtering / state.
 */

export const metadata: Metadata = {
  title: "Case studies",
  description:
    "Telemetry-dashboard case studies on AI-native platforms, design-system infrastructure, streaming-grade reliability, and agentic UX.",
  alternates: { canonical: "/work" },
};

const VALID_PATTERNS: readonly PatternId[] = [
  "ai-native",
  "design-systems",
  "streaming",
  "agentic-ux",
  "enterprise",
];

function parsePatternsFromQuery(value: string | string[] | undefined): PatternId[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw.filter((p): p is PatternId => VALID_PATTERNS.includes(p as PatternId));
}

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string | string[] }>;
}) {
  const { p } = await searchParams;
  const selected = parsePatternsFromQuery(p);

  // Sort by `order` ascending; ties broken by date desc (most recent first).
  const ordered = [...caseStudies]
    .filter((study) => !study.draft)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return b.publishedAt.localeCompare(a.publishedAt);
    });

  const visible =
    selected.length === 0
      ? ordered
      : ordered.filter((study) => selected.some((p) => study.patterns.includes(p as PatternId)));

  // Patterns that show up in *any* of the case studies — drives the filter
  // strip's available chips (so we don't show patterns with zero results).
  const availablePatterns = Array.from(
    new Set(ordered.flatMap((study) => study.patterns)),
  ) as PatternId[];

  return (
    <section
      role="region"
      aria-labelledby="work-heading"
      className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 pt-20 pb-32 sm:px-6 lg:px-8"
    >
      <header className="flex flex-col gap-6">
        <div className="border-border bg-surface text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
          <StatusDot tone="good" />
          <span>Case studies · {ordered.length} engagements</span>
        </div>
        <h1
          id="work-heading"
          className="text-foreground text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.05] font-medium tracking-tight text-balance"
        >
          Postmortems, not marketing pages.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
          Each engagement gets rendered like a telemetry dashboard — scale metrics, system diagrams,
          decisions log, tradeoffs, outcomes. Filter by the patterns that matter to your bar.
        </p>
        <PatternFilter available={availablePatterns} selected={selected} />
      </header>

      {visible.length === 0 ? (
        <div className="border-border bg-surface text-muted-foreground rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm leading-relaxed">
            No case studies match the current filter. Reset to see all engagements.
          </p>
        </div>
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

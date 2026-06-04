import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { essays } from "#content";
import { PatternFilter } from "@/components/common/pattern-filter";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { patterns as patternMeta, type PatternId } from "@/content/data/career-graph";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays on platform engineering, AI-native UX, and design-system infrastructure.",
  alternates: { canonical: "/writing" },
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

export default async function WritingPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string | string[] }>;
}): Promise<ReactElement> {
  const { p } = await searchParams;
  const selected = parsePatternsFromQuery(p);

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
      className="relative mx-auto flex max-w-3xl flex-col gap-10 px-4 pt-20 pb-32 sm:px-6 lg:px-8"
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
            <li key={essay.slug}>
              <Link
                href={essay.permalink}
                className="group bg-surface hover:border-accent/40 hover:bg-surface-muted/60 border-border focus-visible:ring-accent/60 relative block overflow-hidden rounded-lg border p-6 transition-all focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-subtle-foreground flex flex-wrap items-center gap-2 font-mono text-[10px] font-medium tracking-wider uppercase">
                      <span>{essay.publishedAt.slice(0, 10)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{essay.metadata.readingTime} min read</span>
                    </div>
                    <ArrowUpRight
                      className="text-subtle-foreground group-hover:text-accent size-4 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-foreground text-xl font-medium tracking-tight text-balance">
                    {essay.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed text-balance">
                    {essay.dek ?? essay.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {essay.patterns.map((id: PatternId) => {
                      const pat = patternMeta[id];
                      return (
                        <Badge
                          key={id}
                          tone="outline"
                          style={{
                            borderColor: `color-mix(in srgb, var(--${pat.colorVar}) 40%, transparent)`,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className="inline-block size-1.5 rounded-full"
                            style={{ backgroundColor: `var(--${pat.colorVar})` }}
                          />
                          {pat.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

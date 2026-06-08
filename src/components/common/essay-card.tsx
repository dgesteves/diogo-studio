import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { essays } from "#content";
import { PatternBadge } from "@/components/common/pattern-badge";
import type { PatternId } from "@/content/data/career-graph";

type Essay = (typeof essays)[number];

export function EssayCard({ essay }: { essay: Essay }): ReactElement {
  return (
    <li>
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
            {essay.patterns.map((id: PatternId) => (
              <PatternBadge key={id} id={id} />
            ))}
          </div>
        </div>
      </Link>
    </li>
  );
}

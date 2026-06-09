import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { caseStudies } from "#content";
import { PatternBadge } from "@/components/common/pattern-badge";
import { type PatternId } from "@/content/data/patterns";

type CaseStudy = (typeof caseStudies)[number];

export function CaseStudyCard({ study }: { study: CaseStudy }): ReactElement {
  const topMetrics = study.metrics.slice(0, 2);

  return (
    <li>
      <Link
        href={study.permalink}
        className="group bg-surface hover:border-accent/40 hover:bg-surface-muted/60 border-border focus-visible:ring-accent/60 relative block overflow-hidden rounded-lg border p-6 transition-all focus-visible:ring-2 focus-visible:outline-none"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="text-subtle-foreground flex flex-wrap items-center gap-2 font-mono text-[10px] font-medium tracking-wider uppercase">
              <span>{study.company}</span>
              <span aria-hidden="true">·</span>
              <span>{study.role}</span>
              <span aria-hidden="true">·</span>
              <span>{study.years}</span>
            </div>
            <ArrowUpRight
              className="text-subtle-foreground group-hover:text-accent size-4 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-foreground text-xl font-medium tracking-tight text-balance">
              {study.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed text-balance">
              {study.description}
            </p>
          </div>

          {topMetrics.length > 0 ? (
            <dl className="border-border bg-border grid gap-px overflow-hidden rounded-md border sm:grid-cols-2">
              {topMetrics.map((metric) => (
                <div key={metric.label} className="bg-surface flex flex-col gap-1 p-3">
                  <dt className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
                    {metric.label}
                  </dt>
                  <dd className="text-foreground flex items-baseline gap-1.5 text-sm">
                    <span className="tabular text-base font-medium tracking-tight">
                      {metric.value}
                    </span>
                    {metric.unit ? (
                      <span className="text-muted-foreground font-mono text-[10px] tracking-wider">
                        {metric.unit}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5">
            {study.patterns.map((id: PatternId) => (
              <PatternBadge key={id} id={id} />
            ))}
          </div>
        </div>
      </Link>
    </li>
  );
}

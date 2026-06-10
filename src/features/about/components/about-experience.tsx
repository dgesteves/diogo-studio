import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/constants/routes";
import { nodes } from "@/content/data/career-graph-nodes";
import { patterns } from "@/content/data/patterns";
import { nodeHref } from "@/features/career-graph";

import { SectionLabel } from "./about-section";

export function AboutExperience(): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <SectionLabel>Selected experience</SectionLabel>
      <ol className="flex flex-col">
        {nodes.map((node) => {
          const href = nodeHref(node);
          const hasCaseStudy = href.startsWith(`${routes.work}/`);
          return (
            <li
              key={node.id}
              className="border-border grid gap-3 border-t py-5 first:border-t-0 sm:grid-cols-[7rem_1fr]"
            >
              <span className="text-subtle-foreground tabular pt-0.5 font-mono text-xs tracking-wider">
                {node.years}
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-foreground text-base font-medium tracking-tight">
                    {node.fullName}
                  </h3>
                  <span className="text-muted-foreground text-sm">{node.role}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{node.summary}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {node.patterns.map((id) => (
                    <Badge
                      key={id}
                      tone="outline"
                      style={{
                        borderColor: `color-mix(in srgb, var(--${patterns[id].colorVar}) 40%, transparent)`,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="inline-block size-1.5 rounded-full"
                        style={{ backgroundColor: `var(--${patterns[id].colorVar})` }}
                      />
                      {patterns[id].label}
                    </Badge>
                  ))}
                  {hasCaseStudy ? (
                    <Link
                      href={href}
                      className="text-accent hover:text-accent ml-auto inline-flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase underline-offset-4 hover:underline"
                    >
                      Read case study
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

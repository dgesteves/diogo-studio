import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PatternBadge } from "@/components/common/pattern-badge";
import { type PatternId } from "@/content/data/career-graph";

export function ArticleHeaderLinks({
  patterns,
  links,
}: {
  patterns: PatternId[];
  links?: { label: string; href: string }[];
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
          Patterns
        </span>
        {patterns.map((id) => (
          <PatternBadge key={id} id={id} />
        ))}
      </div>
      {links && links.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
            Links
          </span>
          {links.map((link) => {
            const isExternal = link.href.startsWith("http");
            return (
              <Link
                key={link.href}
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="border-border hover:border-accent/60 hover:text-accent text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs leading-tight transition-colors"
              >
                {link.label}
                {isExternal ? <ArrowUpRight className="size-3" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

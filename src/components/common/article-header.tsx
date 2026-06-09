import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { type PatternId } from "@/content/data/patterns";

import { ArticleHeaderLinks } from "./article-header-links";

export type ArticleHeaderMeta = {
  eyebrow: string;
  title: string;
  dek?: string;
  description: string;
  facts: { label: string; value: string }[];
  patterns: PatternId[];
  links?: { label: string; href: string }[];
  backHref: string;
  backLabel: string;
};

export function ArticleHeader({
  eyebrow,
  title,
  dek,
  description,
  facts,
  patterns,
  links,
  backHref,
  backLabel,
}: ArticleHeaderMeta): ReactElement {
  return (
    <header className="relative flex flex-col gap-7">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase transition-colors"
        >
          <ArrowLeft className="size-3" aria-hidden="true" />
          {backLabel}
        </Link>
      </div>

      <div className="border-border bg-surface text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
        <StatusDot tone="good" />
        <span>{eyebrow}</span>
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-foreground text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.05] font-medium tracking-tight text-balance">
          {title}
        </h1>
        {dek ? (
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
            {dek}
          </p>
        ) : null}
        {!dek && description ? (
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
            {description}
          </p>
        ) : null}
      </div>

      <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
        {facts.slice(0, 4).map((fact) => (
          <div key={fact.label} className="bg-surface flex flex-col gap-1.5 p-4">
            <dt className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
              {fact.label}
            </dt>
            <dd className="text-foreground text-sm leading-relaxed">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <ArticleHeaderLinks patterns={patterns} links={links} />
    </header>
  );
}

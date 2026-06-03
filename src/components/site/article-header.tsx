import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { patterns as patternMeta, type PatternId } from "@/content/data/career-graph";

/**
 * Shared header strip for `/work/[slug]` and `/writing/[slug]`.
 *
 * Console-grade metadata: eyebrow status pill, title, dek, then a
 * 4-column meta grid (date, length / company, role / years, patterns).
 * Patterns reuse the same color tokens the career graph assigns, so a
 * reader who saw "agentic-ux" in cyan on the home page sees the same
 * cyan here.
 */

export type ArticleHeaderMeta = {
  /** Short eyebrow tag, e.g. "Case study · Phase 3" or "Essay". */
  eyebrow: string;
  /** Top-line page title. */
  title: string;
  /** Optional 1-line dek under the title. Falls back to description. */
  dek?: string;
  description: string;
  /** Right-aligned metadata cells. Order matters; first 4 render. */
  facts: { label: string; value: string }[];
  patterns: PatternId[];
  /** Optional inline links — companion deep-links surfaced as small chips. */
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
}: ArticleHeaderMeta) {
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

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
            Patterns
          </span>
          {patterns.map((id) => {
            const p = patternMeta[id];
            return (
              <Badge
                key={id}
                tone="outline"
                style={{
                  borderColor: `color-mix(in srgb, var(--${p.colorVar}) 40%, transparent)`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="inline-block size-1.5 rounded-full"
                  style={{ backgroundColor: `var(--${p.colorVar})` }}
                />
                {p.label}
              </Badge>
            );
          })}
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
    </header>
  );
}

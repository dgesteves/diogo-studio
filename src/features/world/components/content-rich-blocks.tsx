import { type ReactElement } from "react";
import Link from "next/link";
import type { ContentBlock } from "../types";

type Stats = Extract<ContentBlock, { kind: "stats" }>["items"];
type Cards = Extract<ContentBlock, { kind: "cards" }>["items"];
type Timeline = Extract<ContentBlock, { kind: "timeline" }>["items"];
type Links = Extract<ContentBlock, { kind: "links" }>["items"];

const CHIP =
  "border-border bg-surface/60 text-foreground hover:border-accent/60 hover:text-accent focus-visible:border-accent inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors";

export function StatsBlock({ items }: { items: Stats }): ReactElement {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((stat) => (
        <div key={stat.label} className="border-border/60 bg-surface/40 rounded-lg border p-4">
          <dt className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
            {stat.label}
          </dt>
          <dd className="text-foreground mt-1 text-2xl font-medium tracking-tight">{stat.value}</dd>
          {stat.hint ? <dd className="text-muted-foreground mt-0.5 text-xs">{stat.hint}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

export function CardsBlock({ items }: { items: Cards }): ReactElement {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((card) => (
        <li key={card.title} className="border-border/60 bg-surface/40 rounded-lg border p-4">
          {card.meta ? (
            <p className="text-accent font-mono text-[10px] tracking-wider uppercase">
              {card.meta}
            </p>
          ) : null}
          <h3 className="text-foreground mt-1 font-medium tracking-tight">{card.title}</h3>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{card.body}</p>
        </li>
      ))}
    </ul>
  );
}

export function TimelineBlock({ items }: { items: Timeline }): ReactElement {
  return (
    <ol className="border-border/60 relative ml-1 space-y-5 border-l pl-5">
      {items.map((item) => (
        <li key={`${item.period}-${item.title}`} className="relative">
          <span
            aria-hidden
            className="bg-accent absolute top-1.5 left-[-1.42rem] size-2 rounded-full"
          />
          <p className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
            {item.period}
          </p>
          <h3 className="text-foreground mt-0.5 font-medium tracking-tight">{item.title}</h3>
          {item.org ? <p className="text-muted-foreground font-mono text-xs">{item.org}</p> : null}
          <ul className="text-muted-foreground mt-1.5 space-y-1 text-sm leading-relaxed">
            {item.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function LinksBlock({ items }: { items: Links }): ReactElement {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((link) => (
        <li key={link.label}>
          {link.external ? (
            <a href={link.href} target="_blank" rel="noopener noreferrer" className={CHIP}>
              {link.label}
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <Link href={link.href} className={CHIP}>
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

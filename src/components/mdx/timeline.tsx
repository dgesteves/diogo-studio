import type { ReactNode } from "react";

/**
 * `<Timeline />` — phased project narrative.
 *
 * Each `<Phase />` represents a chunk of the engagement: a tag (e.g.
 * "Phase 01"), a title, dates, and a body. Renders as a vertical rail
 * with a 1px hairline; the dots align on the rail so reading is
 * top-to-bottom and effortless.
 */

export function Timeline({ children }: { children: ReactNode }) {
  return (
    <ol
      className="not-prose mdx-timeline border-border-strong relative flex flex-col gap-6 border-l border-dashed pl-6"
      data-mdx-block="timeline"
    >
      {children}
    </ol>
  );
}

export function Phase({
  tag,
  title,
  dates,
  children,
}: {
  tag: string;
  title: string;
  dates?: string;
  children: ReactNode;
}) {
  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className="border-background bg-accent absolute top-1 left-[-31px] grid size-3 place-items-center rounded-full border-[3px]"
      />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-accent font-mono text-[10px] font-medium tracking-wider uppercase">
            {tag}
          </span>
          {dates ? (
            <span className="text-subtle-foreground tabular font-mono text-[10px] tracking-wider uppercase">
              {dates}
            </span>
          ) : null}
        </div>
        <h3 className="text-foreground text-base font-medium tracking-tight">{title}</h3>
        <div className="text-muted-foreground text-sm leading-relaxed [&>p]:my-0">{children}</div>
      </div>
    </li>
  );
}

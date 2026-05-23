import type { ReactNode } from "react";

/**
 * `<Outcome />` — single-sentence outcome callout, bottom of a case study.
 *
 * Frames the metric / impact in plain language — pairs with the
 * `outcomes` array in the case-study frontmatter (schema-required) so
 * every case study closes on a concrete statement, not adjectives.
 *
 * Implementation note: the outer wrapper is a `<div>` (not `<p>`)
 * because MDX wraps the `children` text in its own `<p>` automatically,
 * and `<p><p>` is invalid HTML — React would emit a hydration error.
 * The inner content area is the one styled like a paragraph; its
 * `[&>p]:my-0` rule strips MDX's default paragraph spacing so the block
 * still reads as a single line.
 */
export function Outcome({ tag, children }: { tag?: string; children: ReactNode }) {
  return (
    <div
      className="not-prose border-signal-good/40 bg-signal-good/5 text-foreground flex items-baseline gap-3 rounded-md border-l-2 px-4 py-3 text-sm leading-relaxed"
      data-mdx-block="outcome"
    >
      <span className="text-signal-good font-mono text-[10px] font-medium tracking-wider uppercase">
        {tag ?? "Outcome"}
      </span>
      <div className="flex-1 [&>p]:my-0">{children}</div>
    </div>
  );
}

import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { Callout } from "./callout";
import { Decision, DecisionsLog } from "./decisions-log";
import { MetricGrid, MetricTile } from "./metric-tile";
import { Outcome } from "./outcome";
import { Sparkline } from "./sparkline";
import { StackList } from "./stack-list";
import { SystemDiagram } from "./system-diagram";
import { Phase, Timeline } from "./timeline";
import { Tradeoff } from "./tradeoff";

/**
 * Shared MDX component map.
 *
 * Anything authored in `src/content/**.mdx` resolves through here. The
 * map serves two jobs:
 *
 * 1. **Prose primitives** — re-style raw markdown elements (`h2`, `p`,
 *    `a`, `code`, …) so they inherit our type scale + console palette
 *    without each MDX doc needing to know about Tailwind.
 *
 * 2. **Custom components** — `<MetricTile />`, `<DecisionsLog />`, etc.
 *    Authors compose these directly inside MDX. The components are
 *    Server-rendered by default; only `<SystemDiagram />` is a Client
 *    Component (xyflow needs the DOM).
 */

/** Smart anchor — internal links use next/link, external links open new tab. */
function MdxAnchor({ href, children, ...rest }: ComponentPropsWithoutRef<"a">) {
  if (!href) {
    return <a {...rest}>{children}</a>;
  }
  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) {
    return (
      <Link href={href} className="mdx-link">
        {children}
      </Link>
    );
  }
  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer" className="mdx-link">
      {children}
    </a>
  );
}

/**
 * Tag map applied to plain-markdown nodes inside MDX. All styles live in
 * `mdx.css` (a CSS layer scoped via the `.mdx-prose` container) so MDX
 * files stay free of Tailwind soup.
 */
export const mdxComponents = {
  a: MdxAnchor,
  // Custom components authored directly in MDX.
  Callout,
  Decision,
  DecisionsLog,
  MetricGrid,
  MetricTile,
  Outcome,
  Phase,
  Sparkline,
  StackList,
  SystemDiagram,
  Timeline,
  Tradeoff,
} as const;

export type MdxComponents = typeof mdxComponents;

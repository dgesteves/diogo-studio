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

export const mdxComponents = {
  a: MdxAnchor,
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

import type { ReactElement } from "react";
import Link from "next/link";

import type { CareerNode } from "@/features/career-graph/constants/career-graph-nodes";

import { nodeHref } from "../lib/node-href";
import { VIEWPORT } from "./career-graph-svg-viewport";

function labelPlacement(p: { x: number; y: number }): "above" | "below" {
  return p.y < VIEWPORT.height * 0.55 ? "below" : "above";
}

export function Node({
  node,
  position,
}: {
  node: CareerNode;
  position: { x: number; y: number };
}): ReactElement {
  const r = 13 * node.weight;
  const hitR = Math.max(r * 2.6, 36);
  const placement = labelPlacement(position);
  const labelOffset = placement === "below" ? r + 26 : -r - 18;
  const yearOffset = placement === "below" ? r + 48 : -r - 40;
  const dominantBaseline = placement === "below" ? "hanging" : "auto";

  return (
    <Link
      href={nodeHref()}
      data-career-graph-node={node.id}
      aria-label={`${node.fullName} — ${node.role}, ${node.years}. ${node.summary}`}
      className="cg-node-link group cursor-pointer outline-none"
    >
      <g transform={`translate(${position.x} ${position.y})`} style={{ pointerEvents: "all" }}>
        <title>{`${node.fullName} — ${node.role}\n${node.years}\n${node.summary}`}</title>

        <circle r={hitR} fill="transparent" />
        <circle r={r * 4} fill="url(#cg-node-halo)" className="cg-node-halo" />
        <circle
          r={r}
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="1.5"
          className="cg-node-ring"
        />
        <circle r={r * 0.45} fill="var(--accent)" className="cg-node-dot" />

        <text
          y={labelOffset}
          textAnchor="middle"
          dominantBaseline={dominantBaseline}
          fontFamily="var(--font-mono)"
          fontSize="19"
          letterSpacing="0.08em"
          fill="var(--foreground)"
          style={{
            paintOrder: "stroke",
            stroke: "var(--background)",
            strokeWidth: 5,
            fontWeight: 500,
          }}
        >
          {node.label.toUpperCase()}
        </text>
        <text
          y={yearOffset}
          textAnchor="middle"
          dominantBaseline={dominantBaseline}
          fontFamily="var(--font-mono)"
          fontSize="15"
          letterSpacing="0.1em"
          fill="var(--subtle-foreground)"
          style={{
            paintOrder: "stroke",
            stroke: "var(--background)",
            strokeWidth: 5,
          }}
        >
          {node.years}
        </text>
      </g>
    </Link>
  );
}

import type { ReactElement } from "react";
import {
  edges,
  getNode,
  nodes,
  patterns,
  projectToSvg,
  type NodeId,
} from "@/content/data/career-graph";

import { Axis } from "./career-graph-axis";
import { CareerGraphDefs } from "./career-graph-defs";
import { Node } from "./career-graph-node";
import { VIEWPORT } from "./career-graph-svg-viewport";

const sortedNodes = [...nodes].sort((a, b) => b.position[0] - a.position[0]);

export function CareerGraphSvg({
  className,
  ariaLabelledBy,
  ariaHidden,
}: {
  className?: string;
  ariaLabelledBy?: string;
  ariaHidden?: boolean;
}): ReactElement {
  const positions = Object.fromEntries(
    nodes.map((n) => [n.id, projectToSvg(n.position, VIEWPORT)] as const),
  ) as Record<NodeId, { x: number; y: number }>;

  return (
    <div className={className} data-career-graph-svg="">
      <svg
        viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-labelledby={ariaLabelledBy}
        aria-hidden={ariaHidden}
        className="block h-full w-full"
      >
        <CareerGraphDefs />

        <rect
          width="100%"
          height="100%"
          fill="url(#cg-grid)"
          mask="url(#cg-grid-mask-clip)"
          opacity="0.5"
        />

        <Axis />

        <g aria-hidden="true">
          {edges.map((edge, idx) => {
            const a = positions[edge.from];
            const b = positions[edge.to];
            const fromOld = a.x <= b.x ? a : b;
            const toNew = a.x <= b.x ? b : a;
            const len = Math.hypot(toNew.x - fromOld.x, toNew.y - fromOld.y);
            const tracer = Math.max(18, len * 0.14);
            // Stagger tracer phase per edge so they don't pulse in lockstep —
            // multiples of 0.6s wrapped within the 3.6s `cg-edge-tracer` period.
            const delay = -(idx * 0.6) % 3.6;
            return (
              <g key={edge.id}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={`url(#cg-edge-${edge.pattern})`}
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
                <line
                  x1={fromOld.x}
                  y1={fromOld.y}
                  x2={toNew.x}
                  y2={toNew.y}
                  className="cg-edge-tracer"
                  stroke={`var(--${patterns[edge.pattern].colorVar})`}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeDasharray={`${tracer} ${Math.max(20, len)}`}
                  style={{ animationDelay: `${delay}s` }}
                />
              </g>
            );
          })}
        </g>

        {sortedNodes.map((node) => {
          const p = positions[node.id];
          if (!p) return null;
          return <Node key={node.id} node={node} position={p} />;
        })}
      </svg>
    </div>
  );
}

export function CareerGraphAccessibleDescription({ id }: { id: string }): ReactElement {
  return (
    <p id={id} className="sr-only">
      A career graph of {nodes.length} engagements connected by {edges.length} pattern
      relationships:{" "}
      {sortedNodes.map((n, i) => {
        const node = getNode(n.id);
        return (
          <span key={node.id}>
            {node.fullName} as {node.role} ({node.years}){i < sortedNodes.length - 1 ? "; " : "."}
          </span>
        );
      })}{" "}
      Patterns:{" "}
      {Object.values(patterns)
        .map((p) => p.label)
        .join(", ")}
      .
    </p>
  );
}

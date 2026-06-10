import type { ReactElement } from "react";

import { edgeAnchor } from "./system-diagram-geometry";
import type { SystemEdge } from "./system-diagram-types";

type Point = { cx: number; cy: number };

export function FallbackEdge({
  edge,
  from,
  to,
}: {
  edge: SystemEdge;
  from: Point;
  to: Point;
}): ReactElement {
  const { start, end } = edgeAnchor(from, to);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dash = edge.variant === "dashed" ? "6 4" : edge.variant === "dotted" ? "2 4" : undefined;

  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        strokeWidth={1.25}
        strokeDasharray={dash}
        className="stroke-border-strong"
      />
      {edge.label ? (
        <g>
          <rect
            x={midX - 38}
            y={midY - 9}
            width={76}
            height={18}
            rx={4}
            className="fill-background stroke-border"
            strokeWidth={1}
          />
          <text
            x={midX}
            y={midY + 3}
            textAnchor="middle"
            fontSize={9}
            className="fill-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {edge.label}
          </text>
        </g>
      ) : null}
    </g>
  );
}

import type { ReactElement } from "react";

import { project, VIEW_H, VIEW_W } from "./system-diagram-geometry";
import { FallbackEdge } from "./system-diagram-fallback-edge";
import { FallbackNode } from "./system-diagram-fallback-node";
import type { SystemDiagramData } from "@/content/schema/system-diagram";

export function SystemDiagramFallback({
  title,
  description,
  data,
  height,
}: {
  title: string;
  description?: string;
  data: SystemDiagramData;
  height: number;
}): ReactElement {
  const projected = new Map(data.nodes.map((n) => [n.id, project(n.x, n.y)]));

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height={height}
      className="block"
    >
      <title>{title}</title>
      {description ? <desc>{description}</desc> : null}

      <g>
        {data.edges.map((edge) => {
          const from = projected.get(edge.from);
          const to = projected.get(edge.to);
          if (!from || !to) return null;
          return <FallbackEdge key={edge.id} edge={edge} from={from} to={to} />;
        })}
      </g>

      <g>
        {data.nodes.map((node) => {
          const p = projected.get(node.id);
          if (!p) return null;
          return <FallbackNode key={node.id} node={node} p={p} />;
        })}
      </g>
    </svg>
  );
}

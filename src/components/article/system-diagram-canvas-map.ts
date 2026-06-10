import type { Edge, Node } from "@xyflow/react";

import { nodeTopLeft } from "./system-diagram-geometry";
import type { SystemDiagramData, SystemNode } from "@/content/schema/system-diagram";

export function mapNodes(nodes: readonly SystemNode[]): Node[] {
  return nodes.map((n) => {
    const { left, top } = nodeTopLeft(n.x, n.y);
    return {
      id: n.id,
      type: "default",
      position: { x: left, y: top },
      data: { label: n.label, detail: n.detail, kind: n.kind },
      draggable: false,
      connectable: false,
      selectable: false,
    };
  });
}

export function mapEdges(edges: SystemDiagramData["edges"]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    label: e.label,
    type: "smoothstep",
    animated: false,
    style: {
      stroke: "var(--border-strong)",
      strokeDasharray: e.variant === "dashed" ? "6 4" : e.variant === "dotted" ? "2 4" : undefined,
      strokeWidth: 1.25,
    },
    labelStyle: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fill: "var(--muted-foreground)",
    },
    labelBgStyle: { fill: "var(--background)" },
  }));
}

import type { ReactElement } from "react";
import { edges } from "@/features/career-graph/data/career-graph-edges";
import { nodes } from "@/features/career-graph/data/career-graph-nodes";
import { patterns } from "@/data/patterns";

import { getNode } from "../lib/get-node";

const sortedNodes = [...nodes].sort((a, b) => b.position[0] - a.position[0]);

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

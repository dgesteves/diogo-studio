import { nodes } from "@/content/data/career-graph-nodes";
import type { CareerNode, NodeId } from "@/content/data/career-graph-nodes";

export function getNode(id: NodeId): CareerNode {
  const node = nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Unknown career-graph node: ${id}`);
  return node;
}

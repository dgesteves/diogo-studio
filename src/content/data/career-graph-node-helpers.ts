import { nodes } from "./career-graph-nodes";
import type { CareerNode, NodeId } from "./career-graph-node-types";

export const PUBLISHED_CASE_STUDY_SLUGS = new Set<string>([
  "eino-ai-network-planning",
  "peacock-streaming",
  "diligent-design-system",
]);

export function nodeHref(node: CareerNode): string {
  if (node.slug && PUBLISHED_CASE_STUDY_SLUGS.has(node.slug)) {
    return `/work/${node.slug}`;
  }
  return "/work";
}

export function getNode(id: NodeId): CareerNode {
  const n = nodes.find((node) => node.id === id);
  if (!n) throw new Error(`Unknown career-graph node: ${id}`);
  return n;
}

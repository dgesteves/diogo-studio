import type { PatternId } from "@/constants/patterns";
import { nodes, type NodeId } from "./career-graph-nodes";

export type CareerEdge = {
  id: string;
  from: NodeId;
  to: NodeId;
  pattern: PatternId;
  sharedPatterns: PatternId[];
};

const patternPriority: Record<PatternId, number> = {
  "ai-native": 0,
  "agentic-ux": 1,
  "design-systems": 2,
  streaming: 3,
  enterprise: 4,
};

function pickPrimaryPattern(shared: PatternId[]): PatternId {
  return shared.reduce((best, p) => (patternPriority[p] < patternPriority[best] ? p : best));
}

export const edges: readonly CareerEdge[] = (() => {
  const out: CareerEdge[] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      if (!a || !b) continue;
      const shared = a.patterns.filter((p) => b.patterns.includes(p));
      if (shared.length === 0) continue;
      out.push({
        id: `${a.id}--${b.id}`,
        from: a.id,
        to: b.id,
        pattern: pickPrimaryPattern(shared),
        sharedPatterns: shared,
      });
    }
  }
  return out;
})();

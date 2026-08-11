import type { AgentChunk } from "@/schemas/agent";

export function makeChunk(
  overrides: Partial<AgentChunk> & Pick<AgentChunk, "id" | "content">,
): AgentChunk {
  return {
    sourceId: overrides.sourceId ?? overrides.id,
    sourceKind: overrides.sourceKind ?? "case-study",
    sourceTitle: overrides.sourceTitle ?? overrides.id,
    permalink: overrides.permalink ?? "/work",
    contentHash: overrides.contentHash ?? "deadbeef",
    ...overrides,
  };
}

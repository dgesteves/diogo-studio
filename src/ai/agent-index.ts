import "server-only";

import { agentIndexSchema } from "@/schemas/agent";
import type { AgentChunk, AgentIndex } from "@/types/agent";

import indexJson from "@/constants/agent-index.json" with { type: "json" };

export const INDEX: AgentIndex = agentIndexSchema.parse(indexJson);
export const CHUNKS: AgentChunk[] = INDEX.chunks;
export const CORPUS_HAS_EMBEDDINGS = CHUNKS.some(
  (c) => Array.isArray(c.embedding) && c.embedding.length > 0,
);

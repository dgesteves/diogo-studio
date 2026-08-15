import "server-only";

import { z } from "zod";

import { agentSourceKindSchema } from "@/chat-contract";

import indexJson from "./index.generated.json" with { type: "json" };

/**
 * The generated corpus, parsed once at import. It is its own module rather than part of
 * `retrieval.ts` because the lifecycles differ: this reads and validates a build artifact at
 * module scope, and everything in `retrieval.ts` is a pure function over whatever chunks it
 * is handed. That seam is what lets `app/api/chat/route.test.ts` run the real scoring against
 * a fake corpus — mocking one module for both would mock the thing under test.
 *
 * `src/agent/index.generated.json` is produced by `pnpm agent:index` from `src/content/**`
 * and guarded by `pnpm agent:index:check`. Never edit it by hand.
 */

const agentChunkSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  sourceKind: agentSourceKindSchema,
  sourceTitle: z.string(),
  permalink: z.string(),
  anchor: z.string().optional(),
  heading: z.string().optional(),
  tags: z.array(z.string()).optional(),
  content: z.string(),
  contentHash: z.string(),
  embedding: z.array(z.number()).optional(),
});

const agentIndexSchema = z.object({
  generatedAt: z.string(),
  embeddingModel: z.string().nullable(),
  embeddingDim: z.number().nullable(),
  chunkerVersion: z.number(),
  chunks: z.array(agentChunkSchema),
});

export type AgentChunk = z.infer<typeof agentChunkSchema>;
export type AgentIndex = z.infer<typeof agentIndexSchema>;

export const INDEX: AgentIndex = agentIndexSchema.parse(indexJson);
export const CHUNKS: AgentChunk[] = INDEX.chunks;
export const CORPUS_HAS_EMBEDDINGS = CHUNKS.some(
  (c) => Array.isArray(c.embedding) && c.embedding.length > 0,
);

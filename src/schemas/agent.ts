import { z } from "zod";

// Both are emitted by the chunker; `"case-study"` and `"essay"` shipped here for as long
// as the index existed and nothing ever produced either.
const agentSourceKindSchema = z.enum(["career", "site"]);

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

export const agentIndexSchema = z.object({
  generatedAt: z.string(),
  embeddingModel: z.string().nullable(),
  embeddingDim: z.number().nullable(),
  chunkerVersion: z.number(),
  chunks: z.array(agentChunkSchema),
});

const agentCitationSchema = z.object({
  marker: z.number(),
  chunkId: z.string(),
  sourceKind: agentSourceKindSchema,
  sourceTitle: z.string(),
  href: z.string(),
  heading: z.string().optional(),
});

export const agentSourcesPayloadSchema = z.object({
  citations: z.array(agentCitationSchema),
  retrieval: z.enum(["cosine", "keyword"]),
  refused: z.boolean(),
});

const MISSING_QUERY = "Missing `query` string.";

export const chatRequestSchema = z.object({
  query: z
    .string({ error: MISSING_QUERY })
    .trim()
    .min(1, MISSING_QUERY)
    .max(600, "Query too long (max 600 chars)."),
});

export type AgentSourceKind = z.infer<typeof agentSourceKindSchema>;
export type AgentChunk = z.infer<typeof agentChunkSchema>;
export type AgentIndex = z.infer<typeof agentIndexSchema>;
export type AgentCitation = z.infer<typeof agentCitationSchema>;
export type AgentSourcesPayload = z.infer<typeof agentSourcesPayloadSchema>;

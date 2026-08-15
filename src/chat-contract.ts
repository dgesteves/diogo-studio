import { z } from "zod";

/**
 * The `/api/chat` wire format — request in, sources header out. It is a root leaf rather
 * than part of `agent/` because both ends read it and neither owns it: the route validates
 * against it, the ⌘K answer surface decodes against it, and no client module may import
 * `agent/` even for a type. See `docs/refactor.md` §4.3 rule 4.
 */

// Both are emitted by the chunker; `"case-study"` and `"essay"` shipped here for as long
// as the index existed and nothing ever produced either.
export const agentSourceKindSchema = z.enum(["career", "site"]);

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
export type AgentCitation = z.infer<typeof agentCitationSchema>;
export type AgentSourcesPayload = z.infer<typeof agentSourcesPayloadSchema>;

/**
 * Shared types for the Phase 4 agentic ⌘K Inspector.
 *
 * The shape mirrors what `scripts/build-agent-index.ts` writes to
 * `src/content/agent-index.json`. Kept duplicated (not imported) so the
 * build script stays free of `@/` path aliases and the runtime types stay
 * free of any Node-only assumptions.
 */

export type AgentSourceKind = "case-study" | "essay" | "career" | "site";

export type AgentChunk = {
  id: string;
  sourceId: string;
  sourceKind: AgentSourceKind;
  sourceTitle: string;
  permalink: string;
  anchor?: string;
  heading?: string;
  tags?: string[];
  content: string;
  contentHash: string;
  embedding?: number[];
};

export type AgentIndex = {
  generatedAt: string;
  embeddingModel: string | null;
  embeddingDim: number | null;
  chunkerVersion: number;
  chunks: AgentChunk[];
};

/**
 * What the API returns alongside the streamed text — the deep-link payload
 * for citation chips in the cmdk Inspector UI.
 */
export type AgentCitation = {
  /** 1-based index — what the model emits in-text as `[1]`, `[2]`, … */
  marker: number;
  /** Stable chunk id, for keying React lists. */
  chunkId: string;
  sourceKind: AgentSourceKind;
  sourceTitle: string;
  /** Routable URL including `#anchor` when present. */
  href: string;
  heading?: string;
};

/** Wire shape returned in the `X-Agent-Sources` response header (base64-encoded JSON). */
export type AgentSourcesPayload = {
  citations: AgentCitation[];
  /** Whether the route used cosine (embedding) or keyword (BM25) retrieval. */
  retrieval: "cosine" | "keyword";
  /** Whether the answer was a refusal because no chunk crossed the relevance floor. */
  refused: boolean;
};

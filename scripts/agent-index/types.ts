/**
 * Two kinds, both emitted. It carried `"case-study"` and `"essay"` for as long as the
 * index existed and neither was ever produced by anything.
 */
export type SourceKind = "career" | "site";

export type IndexEntry = {
  id: string;
  sourceId: string;
  sourceKind: SourceKind;
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
  chunks: IndexEntry[];
};

export const CHUNKER_VERSION = 3;
export const EMBED_DIMENSIONS = 512;

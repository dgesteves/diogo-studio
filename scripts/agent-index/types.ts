export type SourceKind = "case-study" | "essay" | "career" | "site";

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

export const CHUNKER_VERSION = 2;
export const EMBED_DIMENSIONS = 512;

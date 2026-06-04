export type SourceKind = "case-study" | "essay" | "career" | "site";

// Duplicated from src/types/agent.ts so this build script stays alias-free —
// it runs via tsx, outside the @/ path-alias runtime.
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
  // Bump when chunking semantics change so `--check` surfaces a needed rebuild.
  chunkerVersion: number;
  chunks: IndexEntry[];
};

export type Frontmatter = {
  title?: string;
  description?: string;
  slug?: string;
  patterns?: string[];
  company?: string;
  role?: string;
  years?: string;
};

export type RawSection = { heading?: string; anchor?: string; body: string };

export const CHUNKER_VERSION = 1;
export const EMBED_DIMENSIONS = 512;

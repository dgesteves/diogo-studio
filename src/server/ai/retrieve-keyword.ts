import "server-only";

import type { AgentChunk } from "@/types/agent";

import { BM25_B, BM25_K1, MIN_KEYWORD_SCORE, TOP_K } from "./retrieve-tunables";
import type { RetrievalHit, RetrievalResult } from "./retrieve-types";

// Kept short on purpose: this is technical prose, and over-aggressive stopword
// removal degrades recall on terms like "of" in "state of the art".
const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "then",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "in",
  "on",
  "for",
  "at",
  "by",
  "with",
  "as",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "i",
  "me",
  "my",
  "we",
  "our",
  "you",
  "your",
  "he",
  "she",
  "they",
  "them",
  "their",
  "how",
  "what",
  "which",
  "who",
  "whom",
  "where",
  "when",
  "why",
  "do",
  "does",
  "did",
  "has",
  "have",
  "had",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "about",
  "tell",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[`'"]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

type CorpusStats = {
  docLengths: number[];
  avgDocLength: number;
  documentFrequency: Map<string, number>;
  termFrequencies: Map<string, number>[];
  totalDocs: number;
};

function buildCorpusStats(chunks: AgentChunk[]): CorpusStats {
  const docLengths: number[] = [];
  const termFrequencies: Map<string, number>[] = [];
  const documentFrequency = new Map<string, number>();
  for (const chunk of chunks) {
    const tokens = tokenize(`${chunk.sourceTitle} ${chunk.heading ?? ""} ${chunk.content}`);
    docLengths.push(tokens.length);
    const freq = new Map<string, number>();
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
    termFrequencies.push(freq);
    for (const t of freq.keys()) documentFrequency.set(t, (documentFrequency.get(t) ?? 0) + 1);
  }
  const totalLength = docLengths.reduce((a, b) => a + b, 0);
  const avgDocLength = docLengths.length ? totalLength / docLengths.length : 0;
  return {
    docLengths,
    avgDocLength,
    documentFrequency,
    termFrequencies,
    totalDocs: chunks.length,
  };
}

function bm25Score(queryTerms: string[], docIndex: number, stats: CorpusStats): number {
  const tf = stats.termFrequencies[docIndex];
  const dl = stats.docLengths[docIndex];
  if (!tf || dl === undefined) return 0;
  let score = 0;
  for (const term of queryTerms) {
    const df = stats.documentFrequency.get(term) ?? 0;
    if (df === 0) continue;
    const idf = Math.log(1 + (stats.totalDocs - df + 0.5) / (df + 0.5));
    const f = tf.get(term) ?? 0;
    if (f === 0) continue;
    const denom = f + BM25_K1 * (1 - BM25_B + (BM25_B * dl) / Math.max(stats.avgDocLength, 1));
    score += idf * ((f * (BM25_K1 + 1)) / denom);
  }
  return score;
}

export function retrieveByKeyword(
  index: AgentChunk[],
  query: string,
  options: { topK?: number; minScore?: number } = {},
): RetrievalResult {
  const topK = options.topK ?? TOP_K;
  const minScore = options.minScore ?? MIN_KEYWORD_SCORE;
  const stats = buildCorpusStats(index);
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) {
    return { hits: [], retrieval: "keyword", refused: true };
  }
  const scored: RetrievalHit[] = [];
  for (let i = 0; i < index.length; i += 1) {
    const chunk = index[i];
    if (!chunk) continue;
    const score = bm25Score(queryTerms, i, stats);
    if (score > 0) scored.push({ chunk, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);
  const refused = top.length === 0 || (top[0]?.score ?? 0) < minScore;
  return { hits: refused ? [] : top, retrieval: "keyword", refused };
}

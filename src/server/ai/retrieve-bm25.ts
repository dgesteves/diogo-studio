import "server-only";

import type { AgentChunk } from "@/types/agent";

import { BM25_B, BM25_K1 } from "./retrieve-tunables";
import { tokenize } from "./retrieve-tokenize";

export type CorpusStats = {
  docLengths: number[];
  avgDocLength: number;
  documentFrequency: Map<string, number>;
  termFrequencies: Map<string, number>[];
  totalDocs: number;
};

export function buildCorpusStats(chunks: AgentChunk[]): CorpusStats {
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

export function bm25Score(queryTerms: string[], docIndex: number, stats: CorpusStats): number {
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

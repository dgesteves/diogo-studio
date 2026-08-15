import "server-only";

import * as Sentry from "@sentry/nextjs";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

import { env } from "@/config/env";

import { INDEX, type AgentChunk } from "./corpus";

/**
 * Retrieval, whole: the tunables, the tokenizer, both scorers and the query embedding.
 * Everything here is a pure function over the chunks it is handed — the corpus itself is
 * `./corpus`, which is the seam the route's tests mock.
 *
 * Two scorers rather than one because the embedding call can fail or be unconfigured, and a
 * portfolio agent that answers nothing without an API key is worse than one that falls back
 * to BM25. `retrieve()` picks; nothing else decides.
 */

/**
 * Raised from 6 when the chunker went per-block: the median chunk fell from roughly a
 * whole page to 166 characters, so six of them is a fraction of the context six used to
 * be. Ten keeps the prompt about as full as it was while retrieval stays precise.
 */
export const TOP_K = 10;

const MIN_COSINE_SCORE = 0.25;
const MIN_KEYWORD_SCORE = 1.5;

const BM25_K1 = 1.5;
const BM25_B = 0.75;

type RetrievalHit = {
  chunk: AgentChunk;
  score: number;
};

export type RetrievalResult = {
  hits: RetrievalHit[];
  retrieval: "cosine" | "keyword";
  refused: boolean;
};

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

export function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i += 1) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function retrieveByCosine(
  index: AgentChunk[],
  queryEmbedding: number[],
  options: { topK?: number; minScore?: number } = {},
): RetrievalResult {
  const topK = options.topK ?? TOP_K;
  const minScore = options.minScore ?? MIN_COSINE_SCORE;
  const scored: RetrievalHit[] = [];
  for (const chunk of index) {
    if (!chunk.embedding) continue;
    const score = cosine(queryEmbedding, chunk.embedding);
    scored.push({ chunk, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);
  const refused = top.length === 0 || (top[0]?.score ?? 0) < minScore;
  return { hits: refused ? [] : top, retrieval: "cosine", refused };
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

export function retrieve(
  index: AgentChunk[],
  query: string,
  queryEmbedding: number[] | null,
  options: { topK?: number } = {},
): RetrievalResult {
  const corpusHasEmbeddings = index.some((c) => Array.isArray(c.embedding) && c.embedding.length);
  if (queryEmbedding && corpusHasEmbeddings) {
    return retrieveByCosine(index, queryEmbedding, options);
  }
  return retrieveByKeyword(index, query, options);
}

export async function embedQuery(query: string, apiKey: string): Promise<number[] | null> {
  try {
    const openaiClient = createOpenAI({ apiKey });
    const result = await embed({
      model: openaiClient.embedding(env.OPENAI_EMBED_MODEL),
      value: query,
      providerOptions: {
        openai: { dimensions: INDEX.embeddingDim ?? 512 },
      },
    });
    return result.embedding;
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "/api/chat", stage: "embed" } });
    return null;
  }
}

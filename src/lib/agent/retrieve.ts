/**
 * Grounded retrieval for the Phase 4 ⌘K Inspector.
 *
 * Two tiers, picked at request time:
 *   1. Cosine similarity over committed embeddings (preferred).
 *   2. BM25-flavored keyword scoring (fallback) when the chunk has no
 *      embedding — e.g. when the index was built without OPENAI_API_KEY
 *      and committed in keyword-only mode.
 *
 * Both tiers return a unified result so the API route stays simple.
 *
 * Design notes:
 * - The keyword tier is a faithful, dependency-free BM25 implementation.
 *   It is intentionally small: this corpus is ~40 chunks, we don't need a
 *   real inverted index. The score formula matches Manning et al. §6.
 * - Cosine retrieval has a relevance floor (`MIN_COSINE_SCORE`). If no
 *   chunk crosses it, the route refuses cleanly and points to /contact —
 *   per the Phase 4 grounding guardrail in the blueprint.
 * - Stopwords are intentionally short; the corpus is technical prose and
 *   over-aggressive stopword removal degrades recall on terms like "of"
 *   in "state of the art."
 */

import type { AgentChunk } from "./types";

/* ---------------------------------------------------------------------------
 * Tunables
 * ------------------------------------------------------------------------- */

/** How many chunks to feed the model. 6 keeps prompt size honest for the
 * cheap model and gives 1-2 citations per answer without overloading. */
export const TOP_K = 6;

/** Minimum cosine similarity for a chunk to count as relevant. Below this,
 * the route refuses the question. Calibrated against this corpus where
 * unrelated queries land in the 0.1–0.2 range and on-topic ones at 0.4+. */
export const MIN_COSINE_SCORE = 0.25;

/** Same idea for the keyword tier. BM25 scores aren't bounded; the floor
 * is calibrated empirically and slightly conservative — we'd rather refuse
 * than hallucinate from a tangential match. */
export const MIN_KEYWORD_SCORE = 1.5;

/* ---------------------------------------------------------------------------
 * Cosine similarity
 * ------------------------------------------------------------------------- */

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

/* ---------------------------------------------------------------------------
 * Keyword / BM25 scoring
 * ------------------------------------------------------------------------- */

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

/** Build a per-corpus statistic bundle once per request — cheap at this scale. */
type CorpusStats = {
  docLengths: number[];
  avgDocLength: number;
  /** term → number of docs containing it. */
  documentFrequency: Map<string, number>;
  /** per-doc term → frequency map. */
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

const BM25_K1 = 1.5;
const BM25_B = 0.75;

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

/* ---------------------------------------------------------------------------
 * Public retrieval API
 * ------------------------------------------------------------------------- */

export type RetrievalHit = {
  chunk: AgentChunk;
  score: number;
};

export type RetrievalResult = {
  hits: RetrievalHit[];
  retrieval: "cosine" | "keyword";
  /** True when the best hit failed the relevance floor — caller should refuse. */
  refused: boolean;
};

/**
 * Cosine-based retrieval. Caller supplies the embedded query vector.
 *
 * Returns up to `TOP_K` hits sorted by similarity. If the best hit fails
 * `MIN_COSINE_SCORE`, returns `refused=true` with the (still-empty) hits
 * array, so the API route can produce a clean grounded refusal.
 */
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

/**
 * BM25 keyword retrieval — used when the corpus has no embeddings (the
 * keyword-only tier from the build script) or when the API has no
 * `OPENAI_API_KEY` available at runtime to embed the query.
 */
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

/**
 * Dispatcher: prefer cosine when an embedded query is supplied AND any
 * indexed chunk carries embeddings; otherwise fall back to keyword.
 */
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

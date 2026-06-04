import "server-only";

import type { AgentChunk } from "@/types/agent";

import { MIN_COSINE_SCORE, TOP_K } from "./retrieve-tunables";
import type { RetrievalHit, RetrievalResult } from "./retrieve-types";

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

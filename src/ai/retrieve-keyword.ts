import "server-only";

import type { AgentChunk } from "@/types/agent";

import { bm25Score, buildCorpusStats } from "./retrieve-bm25";
import { tokenize } from "./retrieve-tokenize";
import { MIN_KEYWORD_SCORE, TOP_K } from "./retrieve-tunables";
import type { RetrievalHit, RetrievalResult } from "./retrieve-types";

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

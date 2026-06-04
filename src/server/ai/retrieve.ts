import "server-only";

import type { AgentChunk } from "@/types/agent";

import { retrieveByCosine } from "./retrieve-cosine";
import { retrieveByKeyword } from "./retrieve-keyword";
import type { RetrievalResult } from "./retrieve-types";

export { cosine, retrieveByCosine } from "./retrieve-cosine";
export { retrieveByKeyword } from "./retrieve-keyword";
export { TOP_K, MIN_COSINE_SCORE, MIN_KEYWORD_SCORE } from "./retrieve-tunables";
export type { RetrievalHit, RetrievalResult } from "./retrieve-types";

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

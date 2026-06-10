import type { AgentChunk } from "@/types/agent";

export type RetrievalHit = {
  chunk: AgentChunk;
  score: number;
};

export type RetrievalResult = {
  hits: RetrievalHit[];
  retrieval: "cosine" | "keyword";
  refused: boolean;
};

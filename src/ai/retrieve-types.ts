import type { AgentChunk } from "@/schemas/agent";

export type RetrievalHit = {
  chunk: AgentChunk;
  score: number;
};

export type RetrievalResult = {
  hits: RetrievalHit[];
  retrieval: "cosine" | "keyword";
  refused: boolean;
};

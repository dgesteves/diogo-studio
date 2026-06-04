export type AskStatus =
  | "idle"
  | "streaming"
  | "done"
  | "refused"
  | "rate-limited"
  | "error"
  | "unconfigured";

export type RetrievalMode = "cosine" | "keyword";

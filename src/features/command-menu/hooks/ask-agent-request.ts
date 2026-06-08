import type { AgentCitation, AgentSourcesPayload } from "@/types/agent";

import type { AskStatus, RetrievalMode } from "../types";
import { decodeAgentSources, safeText } from "./ask-agent-sources";

export type AskCallbacks = {
  setCitations: (citations: AgentCitation[]) => void;
  setRetrieval: (retrieval: RetrievalMode) => void;
  setAnswer: (answer: string) => void;
  setStatus: (status: AskStatus) => void;
  setError: (error: string) => void;
};

export async function runAskRequest(
  query: string,
  signal: AbortSignal,
  cb: AskCallbacks,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
      signal,
    });
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") return;
    cb.setError("Couldn't reach the agent. Check your connection and try again.");
    cb.setStatus("error");
    return;
  }

  const header = res.headers.get("x-agent-sources");
  let payload: AgentSourcesPayload | null = null;
  if (header) {
    payload = decodeAgentSources(header);
    if (payload) {
      cb.setCitations(payload.citations);
      cb.setRetrieval(payload.retrieval);
    }
  }

  if (res.status === 429) {
    const text = await safeText(res);
    cb.setError(text || "Rate limit exceeded. Give it a minute and try again.");
    cb.setStatus("rate-limited");
    return;
  }
  if (res.status === 503) {
    const text = await safeText(res);
    cb.setAnswer(text);
    cb.setStatus("unconfigured");
    return;
  }
  if (!res.ok) {
    cb.setError(`The agent returned ${res.status}. Try again or use Navigate mode.`);
    cb.setStatus("error");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    cb.setError("No response stream available.");
    cb.setStatus("error");
    return;
  }

  const decoder = new TextDecoder();
  let acc = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        acc += decoder.decode(value, { stream: true });
        cb.setAnswer(acc);
      }
    }
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") return;
    cb.setError("The stream was interrupted.");
    cb.setStatus("error");
    return;
  }

  cb.setStatus(payload?.refused ? "refused" : "done");
}

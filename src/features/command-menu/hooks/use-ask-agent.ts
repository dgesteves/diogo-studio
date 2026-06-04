"use client";

import { useEffect, useRef, useState } from "react";

import type { AgentCitation, AgentSourcesPayload } from "@/types/agent";
import { agentSourcesPayloadSchema } from "@/lib/validations/agent";

import type { AskStatus, RetrievalMode } from "../types";

type UseAskAgent = {
  query: string;
  setQuery: (q: string) => void;
  submitted: string | null;
  answer: string;
  citations: AgentCitation[];
  status: AskStatus;
  error: string | null;
  retrieval: RetrievalMode | null;
  ask: (q: string) => Promise<void>;
  stop: () => void;
};

export function useAskAgent(): UseAskAgent {
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<AgentCitation[]>([]);
  const [status, setStatus] = useState<AskStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [retrieval, setRetrieval] = useState<RetrievalMode | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function ask(q: string): Promise<void> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSubmitted(q);
    setStatus("streaming");
    setAnswer("");
    setCitations([]);
    setError(null);
    setRetrieval(null);

    let res: Response;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setError("Couldn't reach the agent. Check your connection and try again.");
      setStatus("error");
      return;
    }

    const header = res.headers.get("x-agent-sources");
    let payload: AgentSourcesPayload | null = null;
    if (header) {
      payload = decodeAgentSources(header);
      if (payload) {
        setCitations(payload.citations);
        setRetrieval(payload.retrieval);
      }
    }

    if (res.status === 429) {
      const text = await safeText(res);
      setError(text || "Rate limit exceeded. Give it a minute and try again.");
      setStatus("rate-limited");
      return;
    }
    if (res.status === 503) {
      const text = await safeText(res);
      setAnswer(text);
      setStatus("unconfigured");
      return;
    }
    if (!res.ok) {
      setError(`The agent returned ${res.status}. Try again or use Navigate mode.`);
      setStatus("error");
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      setError("No response stream available.");
      setStatus("error");
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
          setAnswer(acc);
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setError("The stream was interrupted.");
      setStatus("error");
      return;
    }

    setStatus(payload?.refused ? "refused" : "done");
  }

  function stop(): void {
    abortRef.current?.abort();
    setStatus(answer.length > 0 ? "done" : "idle");
  }

  return {
    query,
    setQuery,
    submitted,
    answer,
    citations,
    status,
    error,
    retrieval,
    ask,
    stop,
  };
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function decodeAgentSources(header: string): AgentSourcesPayload | null {
  try {
    const bytes = Uint8Array.from(atob(header), (ch) => ch.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const result = agentSourcesPayloadSchema.safeParse(JSON.parse(json));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

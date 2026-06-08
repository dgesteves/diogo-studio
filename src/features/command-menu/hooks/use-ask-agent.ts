"use client";

import { useEffect, useRef, useState } from "react";

import type { AgentCitation } from "@/types/agent";

import type { AskStatus, RetrievalMode } from "../types";
import { runAskRequest } from "./ask-agent-request";

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

    await runAskRequest(q, controller.signal, {
      setCitations,
      setRetrieval,
      setAnswer,
      setStatus,
      setError,
    });
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

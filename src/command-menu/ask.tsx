"use client";

import { Network, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactElement, type SyntheticEvent, useEffect, useRef, useState } from "react";

import {
  agentSourcesPayloadSchema,
  type AgentCitation,
  type AgentSourcesPayload,
} from "@/chat-contract";
import { Kbd } from "@/ui/kbd";
import { asInternalHref } from "@/content/pages";
import { useReducedMotionPreference } from "@/reduced-motion";

import { AskAnswerSurface } from "./answer";
import type { AskStatus, RetrievalMode } from "./store";

type Props = {
  onNavigate: () => void;
};

export function CommandMenuAsk({ onNavigate }: Props): ReactElement {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { reducedMotion } = useReducedMotionPreference();
  const { query, setQuery, submitted, answer, citations, status, error, retrieval, ask, stop } =
    useAskAgent();

  // Radix unmounts the dialog's content on close and remounts it on open, so mounting is
  // every time the visitor arrives in Ask mode. A frame late, because the dialog moves
  // focus to itself first.
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  function onSubmit(e: SyntheticEvent<HTMLFormElement>): void {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    void ask(trimmed);
  }

  function onSuggest(s: string): void {
    setQuery(s);
    void ask(s);
  }

  function onCitationClick(href: string): void {
    const target = asInternalHref(href);
    if (!target) return;
    onNavigate();
    requestAnimationFrame(() => router.push(target));
  }

  const isStreaming = status === "streaming";
  const showSuggestions = status === "idle";

  return (
    <div className="flex max-h-[60vh] flex-col">
      <form
        onSubmit={onSubmit}
        className="border-border flex items-center gap-2 border-b px-4"
        aria-label="Ask the Inspector agent"
      >
        <Network className="text-accent size-4" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about Diogo's work — design systems, agentic UX, streaming…"
          className="text-foreground placeholder:text-subtle-foreground h-12 flex-1 bg-transparent text-sm focus:outline-none"
          maxLength={600}
          aria-label="Question for the agent"
          autoComplete="off"
          spellCheck="false"
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={stop}
            className="border-border-strong text-foreground hover:bg-surface-muted flex h-7 items-center gap-1.5 rounded border px-2 font-mono text-[10px] tracking-wider uppercase"
            aria-label="Stop generating"
          >
            <Square className="size-3" aria-hidden="true" />
            Stop
          </button>
        ) : (
          <span className="text-subtle-foreground flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase">
            <Kbd>↵</Kbd>
            Ask
          </span>
        )}
      </form>

      <div className="overflow-y-auto px-4 pt-3 pb-4">
        {showSuggestions ? (
          <Suggestions onPick={onSuggest} />
        ) : (
          <AskAnswerSurface
            question={submitted}
            answer={answer}
            citations={citations}
            status={status}
            error={error}
            retrieval={retrieval}
            reducedMotion={reducedMotion}
            onCitation={onCitationClick}
          />
        )}
      </div>
    </div>
  );
}

const SUGGESTED_QUERIES: { label: string; tag: string }[] = [
  { label: "What is Diogo's design-system thesis?", tag: "Design systems" },
  { label: "Show me Diogo's agentic UX work.", tag: "Agentic UX" },
  { label: "Tell me about Peacock-scale reliability.", tag: "Streaming" },
  { label: "What did Diogo ship at eino.ai?", tag: "AI-native" },
];

function Suggestions({ onPick }: { onPick: (s: string) => void }): ReactElement {
  return (
    <div className="space-y-3">
      <p className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
        Try one of these
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {SUGGESTED_QUERIES.map((s) => (
          <li key={s.label}>
            <button
              type="button"
              onClick={() => onPick(s.label)}
              className="border-border bg-surface hover:border-border-strong hover:bg-surface-muted focus-visible:ring-ring focus-visible:ring-offset-background group flex w-full flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="text-foreground text-sm">{s.label}</span>
              <span className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
                {s.tag}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-subtle-foreground pt-1 text-xs">
        The agent only answers from this site&apos;s indexed career data. It refuses anything
        outside that scope.
      </p>
    </div>
  );
}

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

/**
 * The seam the menu uses, and the one `ask.dom.test.tsx` drives: every state the answer
 * surface can render is a combination of this hook and the request below it.
 */
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

type AskCallbacks = {
  setCitations: (citations: AgentCitation[]) => void;
  setRetrieval: (retrieval: RetrievalMode) => void;
  setAnswer: (answer: string) => void;
  setStatus: (status: AskStatus) => void;
  setError: (error: string) => void;
};

/**
 * One request, one state machine. Every branch the endpoint can produce — 429, 503, a
 * non-OK status, a missing body, an interrupted stream, an abort — sets a status the
 * answer surface can render, because a silent failure here reads as a hung agent.
 */
async function runAskRequest(query: string, signal: AbortSignal, cb: AskCallbacks): Promise<void> {
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

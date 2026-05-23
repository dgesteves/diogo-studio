"use client";

import {
  ArrowUpRight,
  Briefcase,
  FileText,
  Loader2,
  Network,
  Square,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Kbd } from "@/components/ui/kbd";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import type { AgentCitation, AgentSourcesPayload, AgentSourceKind } from "@/lib/agent/types";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Pre-seeded queries — the blueprint S2 examples plus one per pattern theme.
 * Surfaced on first open and after a refusal, so the surface is never empty
 * and visitors discover the shape of what the agent can answer.
 * ------------------------------------------------------------------------- */

const SUGGESTED_QUERIES: { label: string; tag: string }[] = [
  { label: "What is Diogo's design-system thesis?", tag: "Design systems" },
  { label: "Show me Diogo's agentic UX work.", tag: "Agentic UX" },
  { label: "Tell me about Peacock-scale reliability.", tag: "Streaming" },
  { label: "What did Diogo ship at eino.ai?", tag: "AI-native" },
];

/* ---------------------------------------------------------------------------
 * Status machine
 * ------------------------------------------------------------------------- */

type AskStatus =
  | "idle"
  | "streaming"
  | "done"
  | "refused"
  | "rate-limited"
  | "error"
  | "unconfigured";

type Props = {
  /** Called when the user clicks a citation, so the parent dialog can close. */
  onNavigate: () => void;
  /** Bumped by the parent when the dialog opens, so we re-focus the input. */
  openTick: number;
};

/* ---------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */

export function CommandMenuAsk({ onNavigate, openTick }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { reducedMotion } = useReducedMotionPreference();

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<AgentCitation[]>([]);
  const [status, setStatus] = useState<AskStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [retrieval, setRetrieval] = useState<"cosine" | "keyword" | null>(null);

  // Focus input when the dialog opens (or the mode is switched into).
  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [openTick]);

  // Cancel any in-flight request when the component unmounts (dialog closes).
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const askAgent = useCallback(async (q: string) => {
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

    // Parse the sources header before reading the body so the citation chips
    // can show up before the first token streams in.
    const header = res.headers.get("x-agent-sources");
    let payload: AgentSourcesPayload | null = null;
    if (header) {
      try {
        const json = decodeURIComponent(escape(atob(header)));
        payload = JSON.parse(json) as AgentSourcesPayload;
        setCitations(payload.citations ?? []);
        setRetrieval(payload.retrieval);
      } catch {
        // Header missing or corrupted — we'll still show the answer text.
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
  }, []);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      void askAgent(trimmed);
    },
    [askAgent, query],
  );

  const onSuggest = useCallback(
    (s: string) => {
      setQuery(s);
      void askAgent(s);
    },
    [askAgent],
  );

  const onStop = useCallback(() => {
    abortRef.current?.abort();
    setStatus(answer.length > 0 ? "done" : "idle");
  }, [answer.length]);

  const onCitationClick = useCallback(
    (href: string) => {
      onNavigate();
      // Defer routing to the next frame so the dialog closes first — same
      // pattern as the Navigate mode in command-menu.tsx.
      requestAnimationFrame(() => router.push(href));
    },
    [onNavigate, router],
  );

  /* -------------------------------------------------------------------------
   * Rendering
   * ----------------------------------------------------------------------- */

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
            onClick={onStop}
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
          <AnswerSurface
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

/* ---------------------------------------------------------------------------
 * Sub-views
 * ------------------------------------------------------------------------- */

function Suggestions({ onPick }: { onPick: (s: string) => void }) {
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
        The agent only answers from this site&apos;s indexed case studies and career data. It
        refuses anything outside that scope.
      </p>
    </div>
  );
}

function AnswerSurface({
  question,
  answer,
  citations,
  status,
  error,
  retrieval,
  reducedMotion,
  onCitation,
}: {
  question: string | null;
  answer: string;
  citations: AgentCitation[];
  status: AskStatus;
  error: string | null;
  retrieval: "cosine" | "keyword" | null;
  reducedMotion: boolean;
  onCitation: (href: string) => void;
}) {
  return (
    <div className="space-y-3" aria-live="polite" aria-atomic="false">
      {question ? (
        <div className="text-subtle-foreground border-border border-l-2 pl-3 text-xs">
          {question}
        </div>
      ) : null}

      {status === "error" && error ? (
        <p className="text-signal-hot text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {status === "rate-limited" ? (
        <p className="text-signal-warn text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {answer ? (
        <div className="text-foreground text-sm leading-relaxed">
          {renderAnswer(answer, citations, onCitation)}
          {status === "streaming" && !reducedMotion ? (
            <span
              className="bg-accent ml-0.5 inline-block h-3.5 w-1 animate-pulse align-baseline"
              aria-hidden="true"
            />
          ) : null}
        </div>
      ) : status === "streaming" ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2
            className={cn("size-3.5", reducedMotion ? "" : "animate-spin")}
            aria-hidden="true"
          />
          Reading the indexed material…
        </p>
      ) : null}

      {citations.length > 0 ? (
        <CitationList citations={citations} onPick={onCitation} retrieval={retrieval} />
      ) : null}
    </div>
  );
}

function CitationList({
  citations,
  onPick,
  retrieval,
}: {
  citations: AgentCitation[];
  onPick: (href: string) => void;
  retrieval: "cosine" | "keyword" | null;
}) {
  return (
    <div className="border-border space-y-2 border-t pt-3">
      <div className="flex items-center justify-between">
        <p className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
          Sources
        </p>
        {retrieval ? (
          <span
            className="text-subtle-foreground border-border rounded border px-1.5 py-px font-mono text-[10px] tracking-wider uppercase"
            title={
              retrieval === "cosine"
                ? "Retrieved by cosine similarity on text-embedding-3-small."
                : "Retrieved by BM25 keyword scoring (no embeddings configured)."
            }
          >
            {retrieval === "cosine" ? "Embedded" : "Keyword"}
          </span>
        ) : null}
      </div>
      <ul className="grid gap-1.5">
        {citations.map((c) => (
          <li key={c.chunkId}>
            <button
              type="button"
              onClick={() => onPick(c.href)}
              className="border-border bg-surface hover:border-border-strong hover:bg-surface-muted focus-visible:ring-ring focus-visible:ring-offset-background flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="border-border bg-surface-inset text-muted-foreground grid size-6 place-items-center rounded font-mono text-[10px]">
                {c.marker}
              </span>
              <span className="border-border bg-surface-inset text-muted-foreground grid size-7 place-items-center rounded-md border">
                {iconForKind(c.sourceKind)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate text-sm">{c.sourceTitle}</span>
                {c.heading ? (
                  <span className="text-subtle-foreground block truncate text-xs">{c.heading}</span>
                ) : null}
              </span>
              <ArrowUpRight className="text-subtle-foreground size-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Answer rendering
 *
 * Lightweight: handles `[N]` citation markers and `**bold**` / `` `code` ``.
 * The system prompt deliberately keeps answers short and structured so we
 * don't need a full markdown renderer here.
 * ------------------------------------------------------------------------- */

function renderAnswer(
  text: string,
  citations: AgentCitation[],
  onCitation: (href: string) => void,
): ReactNode {
  // Paragraph-level split: blank lines.
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((para, pi) => (
    <p key={pi} className={cn("whitespace-pre-wrap", pi > 0 && "mt-3")}>
      {renderInline(para, citations, onCitation)}
    </p>
  ));
}

function renderInline(
  text: string,
  citations: AgentCitation[],
  onCitation: (href: string) => void,
): ReactNode[] {
  // First, split on citation markers `[N]`. Then within each non-citation
  // segment, apply inline bold/code formatting.
  const out: ReactNode[] = [];
  const citationSplit = text.split(/(\[\d+\])/g);
  for (let i = 0; i < citationSplit.length; i += 1) {
    const seg = citationSplit[i] ?? "";
    const citationMatch = seg.match(/^\[(\d+)\]$/);
    if (citationMatch) {
      const marker = Number(citationMatch[1]);
      const citation = citations.find((c) => c.marker === marker);
      if (citation) {
        out.push(<CitationChip key={`c${i}`} citation={citation} onPick={onCitation} />);
        continue;
      }
      // Unknown marker — render as muted text so the model's mistake is visible.
      out.push(
        <span key={`c${i}`} className="text-subtle-foreground">
          {seg}
        </span>,
      );
      continue;
    }
    out.push(...renderFormatting(seg, `s${i}`));
  }
  return out;
}

function renderFormatting(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      out.push(text.slice(lastIndex, m.index));
    }
    if (m[1] !== undefined) {
      out.push(
        <strong key={`${keyPrefix}-b${idx++}`} className="text-foreground font-semibold">
          {m[1]}
        </strong>,
      );
    } else if (m[2] !== undefined) {
      out.push(
        <code
          key={`${keyPrefix}-c${idx++}`}
          className="bg-surface-inset text-foreground rounded px-1 py-0.5 font-mono text-[0.85em]"
        >
          {m[2]}
        </code>,
      );
    } else if (m[3] !== undefined && m[4] !== undefined) {
      out.push(
        <a key={`${keyPrefix}-l${idx++}`} href={m[4]} className="text-accent hover:underline">
          {m[3]}
        </a>,
      );
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    out.push(text.slice(lastIndex));
  }
  return out;
}

function CitationChip({
  citation,
  onPick,
}: {
  citation: AgentCitation;
  onPick: (href: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(citation.href)}
      className="text-accent border-border bg-surface hover:border-border-strong focus-visible:ring-ring inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 align-baseline font-mono text-[10px] leading-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
      title={`${citation.sourceTitle}${citation.heading ? ` · ${citation.heading}` : ""}`}
      aria-label={`Open source ${citation.marker}: ${citation.sourceTitle}`}
    >
      {citation.marker}
    </button>
  );
}

function iconForKind(kind: AgentSourceKind) {
  if (kind === "case-study") return <Briefcase className="size-4" aria-hidden="true" />;
  if (kind === "essay") return <FileText className="size-4" aria-hidden="true" />;
  if (kind === "career") return <Network className="size-4" aria-hidden="true" />;
  return <UserRound className="size-4" aria-hidden="true" />;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

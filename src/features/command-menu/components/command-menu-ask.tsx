"use client";

import { Network, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactElement, useCallback, useEffect, useRef } from "react";

import { Kbd } from "@/components/ui/kbd";
import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";

import { useAskAgent } from "../hooks/use-ask-agent";
import { AskAnswerSurface } from "./ask-answer-surface";
import { AskSuggestions } from "./ask-suggestions";

type Props = {
  onNavigate: () => void;
  openTick: number;
};

export function CommandMenuAsk({ onNavigate, openTick }: Props): ReactElement {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { reducedMotion } = useReducedMotionPreference();
  const { query, setQuery, submitted, answer, citations, status, error, retrieval, ask, stop } =
    useAskAgent();

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [openTick]);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      void ask(trimmed);
    },
    [ask, query],
  );

  const onSuggest = useCallback(
    (s: string) => {
      setQuery(s);
      void ask(s);
    },
    [ask, setQuery],
  );

  const onCitationClick = useCallback(
    (href: string) => {
      onNavigate();
      // Defer routing one frame so the dialog closes before navigating.
      requestAnimationFrame(() => router.push(href));
    },
    [onNavigate, router],
  );

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
          <AskSuggestions onPick={onSuggest} />
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

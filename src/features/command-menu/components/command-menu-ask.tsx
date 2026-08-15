"use client";

import { Network, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactElement, type SyntheticEvent, useEffect, useRef } from "react";

import { Kbd } from "@/components/ui/kbd";
import { asInternalHref } from "@/content/pages";
import { useReducedMotionPreference } from "@/reduced-motion";

import { useAskAgent } from "../hooks/use-ask-agent";
import { AskAnswerSurface } from "./ask-answer-surface";
import { AskSuggestions } from "./ask-suggestions";

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

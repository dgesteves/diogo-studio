import Link from "next/link";
import { ArrowUpRight, Briefcase, FileText, Loader2, type LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import type { AgentCitation, AgentSourceKind } from "@/chat-contract";
import { asInternalHref } from "@/content/pages";
import { cn } from "@/utils/cn";

import type { AskStatus, RetrievalMode } from "./store";

/**
 * Everything the model's answer turns into on screen. It is one file because the rules that
 * make it safe are one rule: **model output is text.** It is never HTML, a citation resolves
 * only against the server-built list handed in as `citations`, and a link in the answer is
 * narrowed by `sanitizeHref` and `asInternalHref` before it can become an href. Splitting
 * that across four files is how one of them ends up relaxing it alone.
 */

export function AskAnswerSurface({
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
  retrieval: RetrievalMode | null;
  reducedMotion: boolean;
  onCitation: (href: string) => void;
}): ReactElement {
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
          <AskAnswerBody answer={answer} citations={citations} onCitation={onCitation} />
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

function AskAnswerBody({
  answer,
  citations,
  onCitation,
}: {
  answer: string;
  citations: AgentCitation[];
  onCitation: (href: string) => void;
}): ReactElement {
  const paragraphs = answer.split(/\n{2,}/);
  return (
    <>
      {paragraphs.map((para, pi) => (
        <p key={pi} className={cn("whitespace-pre-wrap", pi > 0 && "mt-3")}>
          {renderInline(para, citations, onCitation)}
        </p>
      ))}
    </>
  );
}

function renderInline(
  text: string,
  citations: AgentCitation[],
  onCitation: (href: string) => void,
): ReactNode[] {
  const out: ReactNode[] = [];
  const citationSplit = text.split(/(\[\d+\])/g);
  for (const [i, seg] of citationSplit.entries()) {
    const citationMatch = seg.match(/^\[(\d+)\]$/);
    if (citationMatch) {
      const marker = Number(citationMatch[1]);
      const citation = citations.find((c) => c.marker === marker);
      if (citation) {
        out.push(<CitationChip key={`c${i}`} citation={citation} onPick={onCitation} />);
        continue;
      }
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

function CitationChip({
  citation,
  onPick,
}: {
  citation: AgentCitation;
  onPick: (href: string) => void;
}): ReactElement {
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
      const label = m[3];
      const key = `${keyPrefix}-l${idx++}`;
      const safeHref = sanitizeHref(m[4]);
      const internalHref = safeHref ? asInternalHref(safeHref) : null;
      if (!safeHref) {
        out.push(label);
      } else if (internalHref) {
        out.push(
          <Link key={key} href={internalHref} className="text-accent hover:underline">
            {label}
          </Link>,
        );
      } else if (safeHref.startsWith("#")) {
        out.push(
          <a key={key} href={safeHref} className="text-accent hover:underline">
            {label}
          </a>,
        );
      } else if (safeHref.startsWith("/")) {
        out.push(label);
      } else {
        out.push(
          <a
            key={key}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {label}
          </a>,
        );
      }
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    out.push(text.slice(lastIndex));
  }
  return out;
}

function sanitizeHref(href: string): string | null {
  const trimmed = href.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  try {
    const { protocol } = new URL(trimmed);
    if (protocol === "http:" || protocol === "https:" || protocol === "mailto:") return trimmed;
  } catch {
    return null;
  }
  return null;
}

function CitationList({
  citations,
  onPick,
  retrieval,
}: {
  citations: AgentCitation[];
  onPick: (href: string) => void;
  retrieval: RetrievalMode | null;
}): ReactElement {
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

// A record rather than a chain of guards with a fallback, so a new source kind in
// `chat-contract.ts` fails to typecheck here instead of quietly rendering a person.
const KIND_ICONS: Record<AgentSourceKind, LucideIcon> = {
  career: Briefcase,
  site: FileText,
};

function iconForKind(kind: AgentSourceKind): ReactElement {
  const Icon = KIND_ICONS[kind];
  return <Icon className="size-4" aria-hidden="true" />;
}

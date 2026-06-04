import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import type { AgentCitation } from "@/types/agent";
import { cn } from "@/lib/utils/cn";

export function AskAnswerBody({
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
      const label = m[3];
      const key = `${keyPrefix}-l${idx++}`;
      const safeHref = sanitizeHref(m[4]);
      if (!safeHref) {
        out.push(label);
      } else if (safeHref.startsWith("/") || safeHref.startsWith("#")) {
        out.push(
          <Link key={key} href={safeHref} className="text-accent hover:underline">
            {label}
          </Link>,
        );
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

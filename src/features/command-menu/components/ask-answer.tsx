import type { ReactElement, ReactNode } from "react";

import type { AgentCitation } from "@/types/agent";
import { cn } from "@/utils/cn";

import { renderFormatting } from "./ask-answer-formatting";

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

import { ArrowUpRight, Briefcase, FileText, Network, UserRound } from "lucide-react";
import type { ReactElement } from "react";

import type { AgentCitation, AgentSourceKind } from "@/types/agent";

import type { RetrievalMode } from "../types";

export function AskCitationList({
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

function iconForKind(kind: AgentSourceKind): ReactElement {
  if (kind === "case-study") return <Briefcase className="size-4" aria-hidden="true" />;
  if (kind === "essay") return <FileText className="size-4" aria-hidden="true" />;
  if (kind === "career") return <Network className="size-4" aria-hidden="true" />;
  return <UserRound className="size-4" aria-hidden="true" />;
}

import { Loader2 } from "lucide-react";
import type { ReactElement } from "react";

import type { AgentCitation } from "@/types/agent";
import { cn } from "@/utils/cn";

import type { AskStatus, RetrievalMode } from "../types";
import { AskAnswerBody } from "./ask-answer";
import { AskCitationList } from "./ask-citation-list";

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
        <AskCitationList citations={citations} onPick={onCitation} retrieval={retrieval} />
      ) : null}
    </div>
  );
}

import type { ReactElement } from "react";

const SUGGESTED_QUERIES: { label: string; tag: string }[] = [
  { label: "What is Diogo's design-system thesis?", tag: "Design systems" },
  { label: "Show me Diogo's agentic UX work.", tag: "Agentic UX" },
  { label: "Tell me about Peacock-scale reliability.", tag: "Streaming" },
  { label: "What did Diogo ship at eino.ai?", tag: "AI-native" },
];

export function AskSuggestions({ onPick }: { onPick: (s: string) => void }): ReactElement {
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

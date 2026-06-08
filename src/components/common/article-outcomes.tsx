import type { ReactElement } from "react";

export function ArticleOutcomes({
  outcomes,
}: {
  outcomes: readonly string[];
}): ReactElement | null {
  if (outcomes.length === 0) return null;
  return (
    <section
      aria-label="Outcomes"
      className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-6"
    >
      <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
        Outcomes
      </p>
      <ul className="flex flex-col gap-2.5">
        {outcomes.map((outcome) => (
          <li
            key={outcome}
            className="text-foreground/90 border-signal-good/40 bg-signal-good/5 rounded-md border-l-2 px-4 py-3 text-sm leading-relaxed"
          >
            {outcome}
          </li>
        ))}
      </ul>
    </section>
  );
}

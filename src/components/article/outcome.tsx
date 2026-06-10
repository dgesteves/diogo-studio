import type { ReactElement, ReactNode } from "react";

export function Outcome({ tag, children }: { tag?: string; children: ReactNode }): ReactElement {
  return (
    <div className="border-signal-good/40 bg-signal-good/5 text-foreground flex items-baseline gap-3 rounded-md border-l-2 px-4 py-3 text-sm leading-relaxed">
      <span className="text-signal-good font-mono text-[10px] font-medium tracking-wider uppercase">
        {tag ?? "Outcome"}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

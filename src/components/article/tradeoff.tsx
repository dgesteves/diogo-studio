import type { ReactElement, ReactNode } from "react";

export function Tradeoff({
  title,
  gained,
  paid,
}: {
  title?: string;
  gained: ReactNode;
  paid: ReactNode;
}): ReactElement {
  return (
    <aside
      className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-5"
      aria-label={title ?? "Tradeoff"}
    >
      {title ? (
        <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
          Tradeoff · {title}
        </p>
      ) : (
        <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
          Tradeoff
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-signal-good/40 bg-signal-good/4 rounded-md border-l-2 px-4 py-3">
          <p className="text-signal-good font-mono text-[10px] font-medium tracking-wider uppercase">
            Gained
          </p>
          <div className="text-foreground/90 mt-1.5 text-sm leading-relaxed">{gained}</div>
        </div>
        <div className="border-signal-warn/40 bg-signal-warn/4 rounded-md border-l-2 px-4 py-3">
          <p className="text-signal-warn font-mono text-[10px] font-medium tracking-wider uppercase">
            Paid
          </p>
          <div className="text-foreground/90 mt-1.5 text-sm leading-relaxed">{paid}</div>
        </div>
      </div>
    </aside>
  );
}

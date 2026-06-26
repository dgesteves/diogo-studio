import type { ReactElement } from "react";
import { cn } from "@/utils/cn";

type BootProgressProps = {
  pct: number;
  step: string;
  ready: boolean;
};

export function BootProgress({ pct, step, ready }: BootProgressProps): ReactElement {
  return (
    <div className="w-full">
      <div className="boot-progress-track relative h-2 w-full overflow-hidden rounded-full border border-white/15 bg-white/5">
        <div
          className="boot-fill absolute inset-y-0 left-0 overflow-hidden rounded-full shadow-[0_0_18px_var(--brand-cyan)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        >
          <span className="boot-sheen absolute inset-0" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase">
        <span className="flex items-center gap-2 text-white/70">
          <span
            className={cn(
              "size-1.5 rounded-full",
              ready ? "bg-brand-cyan" : "bg-brand-cyan/70 animate-pulse",
            )}
          />
          {step}
        </span>
        <span
          data-text={`${Math.round(pct)}%`}
          className="boot-glitch tabular text-brand-cyan-bright"
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

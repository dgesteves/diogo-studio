import type { ReactElement, ReactNode } from "react";
import type { MetricTone } from "@/content/schema/article-blocks";
import { cn } from "@/lib/utils/cn";

const toneClasses: Record<MetricTone, { ring: string; value: string }> = {
  default: { ring: "border-border", value: "text-foreground" },
  good: { ring: "border-signal-good/40", value: "text-signal-good" },
  warn: { ring: "border-signal-warn/40", value: "text-signal-warn" },
  hot: { ring: "border-signal-hot/40", value: "text-signal-hot" },
  accent: { ring: "border-accent/40", value: "text-accent" },
};

export function MetricTile({
  label,
  value,
  unit,
  hint,
  tone = "default",
  children,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: MetricTone;
  children?: ReactNode;
}): ReactElement {
  const t = toneClasses[tone];
  return (
    <div
      className={cn("bg-surface flex flex-col gap-3 rounded-lg border p-5", t.ring)}
      role="group"
      aria-label={`${label}: ${value}${unit ? ` ${unit}` : ""}`}
    >
      <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "tabular text-[clamp(1.75rem,3vw,2.5rem)] leading-none font-medium tracking-tight",
            t.value,
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-muted-foreground font-mono text-xs tracking-tight">{unit}</span>
        ) : null}
      </div>
      {children ? <div className="h-10">{children}</div> : null}
      {hint ? <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      {children}
    </div>
  );
}

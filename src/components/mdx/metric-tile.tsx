import type { ReactElement, ReactNode } from "react";

/**
 * `<MetricTile />` — header-of-dashboard metric.
 *
 * Console-grade: small mono caps label, large tabular figure, optional
 * unit + hint, optional sparkline. Used in case-study headers to put the
 * scale numbers above the fold ("show, don't claim").
 *
 * No animations on entry — the metrics are the load-in, not a
 * count-up gimmick. Numbers are static across SSR + hydration so they
 * hit LCP correctly.
 *
 * Substitute for the planned `@tremor/react` widgets — see blueprint §5.2
 * Phase 3 deltas. Zero-dependency, tabular-friendly, dark-mode-correct.
 */

type MetricTone = "default" | "good" | "warn" | "hot" | "accent";

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
  /** Optional inline content — usually a `<Sparkline />`. */
  children?: ReactNode;
}): ReactElement {
  const t = toneClasses[tone];
  return (
    <div
      className={`bg-surface flex flex-col gap-3 border ${t.ring} rounded-lg p-5`}
      role="group"
      aria-label={`${label}: ${value}${unit ? ` ${unit}` : ""}`}
    >
      <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className={`tabular text-[clamp(1.75rem,3vw,2.5rem)] leading-none font-medium tracking-tight ${t.value}`}
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

/**
 * Convenience wrapper — lays out 2–4 `<MetricTile />` children in a grid
 * that adapts from 1 col on mobile to N on desktop. Authored at the top
 * of every case study to anchor the dashboard look.
 */
export function MetricGrid({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      className="not-prose mdx-metric-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]"
      data-mdx-block="metrics"
    >
      {children}
    </div>
  );
}

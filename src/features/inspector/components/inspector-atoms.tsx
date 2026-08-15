import { useId, type ReactElement, type ReactNode } from "react";

import type { VitalSample } from "@/telemetry";
import { cn } from "@/utils/cn";

import { formatVital, ratingTone } from "./inspector-format";

export function Panel({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}): ReactElement {
  // The title looks like a heading and groups everything under it, so it is one (WCAG
  // 1.3.1) — and naming the section by it makes each panel a region a screen reader can
  // jump between, rather than four unlabelled boxes in one overlay.
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="border-border bg-surface-inset/60 rounded-md border p-2.5"
    >
      <h2
        id={titleId}
        className="text-subtle-foreground mb-2 flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-wider uppercase"
      >
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Vital({ name, sample }: { name: string; sample?: VitalSample }): ReactElement {
  return (
    <div className="border-border bg-surface flex flex-col gap-0.5 rounded border px-2 py-1.5">
      <span className="text-subtle-foreground font-mono text-[9px] tracking-wider uppercase">
        {name}
      </span>
      <span
        className={cn(
          "tabular text-sm font-medium",
          sample ? ratingTone[sample.rating] : "text-subtle-foreground",
        )}
      >
        {sample ? formatVital(name, sample.value) : "—"}
      </span>
    </div>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}): ReactElement {
  return (
    <div className="border-border bg-surface flex flex-col gap-0.5 rounded border px-2 py-1.5">
      <span className="text-subtle-foreground font-mono text-[9px] tracking-wider uppercase">
        {label}
      </span>
      <span className={cn("tabular text-sm font-medium", tone ?? "text-foreground")}>{value}</span>
    </div>
  );
}

export function Signal({
  label,
  on,
  onLabel,
  offLabel,
}: {
  label: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
}): ReactElement {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-subtle-foreground font-mono text-[9px] tracking-wider uppercase">
        {label}
      </dt>
      <dd className={cn("font-mono text-[10px]", on ? "text-accent" : "text-muted-foreground")}>
        {on ? onLabel : offLabel}
      </dd>
    </div>
  );
}

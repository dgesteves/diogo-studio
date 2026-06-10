import { type ReactElement, type ReactNode } from "react";

import type { VitalSample } from "@/stores/web-vitals-store";
import { cn } from "@/lib/utils/cn";

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
  return (
    <section className="border-border bg-surface-inset/60 rounded-md border p-2.5">
      <div className="text-subtle-foreground mb-2 flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-wider uppercase">
        {icon}
        {title}
      </div>
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

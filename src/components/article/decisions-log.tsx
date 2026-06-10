import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function DecisionsLog({ children }: { children: ReactNode }): ReactElement {
  return (
    <ol className="not-prose mdx-decisions-log flex flex-col gap-4" data-mdx-block="decisions">
      {children}
    </ol>
  );
}

export function Decision({
  index,
  title,
  constraint,
  options,
  choice,
  outcome,
}: {
  index?: string | number;
  title: string;
  constraint: ReactNode;
  options: ReactNode;
  choice: ReactNode;
  outcome: ReactNode;
}): ReactElement {
  return (
    <li className="border-border bg-surface relative flex flex-col gap-3 rounded-lg border p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-foreground text-base font-medium tracking-tight">{title}</h3>
        {index !== undefined ? (
          <span className="text-subtle-foreground tabular font-mono text-[10px] tracking-wider uppercase">
            Decision {String(index).padStart(2, "0")}
          </span>
        ) : null}
      </div>
      <dl className="border-border bg-border grid gap-px overflow-hidden rounded-md border sm:grid-cols-2">
        <DecisionField label="Constraint" tone="warn">
          {constraint}
        </DecisionField>
        <DecisionField label="Options considered" tone="muted">
          {options}
        </DecisionField>
        <DecisionField label="Choice" tone="accent">
          {choice}
        </DecisionField>
        <DecisionField label="Outcome" tone="good">
          {outcome}
        </DecisionField>
      </dl>
    </li>
  );
}

type DecisionFieldTone = "warn" | "muted" | "accent" | "good";

const fieldToneClasses: Record<DecisionFieldTone, string> = {
  warn: "text-signal-warn",
  muted: "text-subtle-foreground",
  accent: "text-accent",
  good: "text-signal-good",
};

function DecisionField({
  label,
  tone,
  children,
}: {
  label: string;
  tone: DecisionFieldTone;
  children: ReactNode;
}) {
  return (
    <div className="bg-surface-muted flex flex-col gap-1.5 p-4">
      <dt
        className={cn(
          "font-mono text-[10px] font-medium tracking-wider uppercase",
          fieldToneClasses[tone],
        )}
      >
        {label}
      </dt>
      <dd className="text-foreground/90 text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

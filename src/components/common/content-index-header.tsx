import type { ReactElement, ReactNode } from "react";
import { StatusDot } from "@/components/ui/status-dot";

export function ContentIndexHeader({
  eyebrow,
  headingId,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  headingId: string;
  title: string;
  intro: string;
  children: ReactNode;
}): ReactElement {
  return (
    <header className="flex flex-col gap-6">
      <div className="border-border bg-surface text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
        <StatusDot tone="good" />
        <span>{eyebrow}</span>
      </div>
      <h1
        id={headingId}
        className="text-foreground text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.05] font-medium tracking-tight text-balance"
      >
        {title}
      </h1>
      <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
        {intro}
      </p>
      {children}
    </header>
  );
}

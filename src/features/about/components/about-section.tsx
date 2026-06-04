import type { ReactElement, ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }): ReactElement {
  return (
    <h2 className="text-subtle-foreground border-border flex items-center gap-3 border-b pb-3 font-mono text-[11px] font-medium tracking-wider uppercase">
      {children}
    </h2>
  );
}

export function Prose({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <SectionLabel>{title}</SectionLabel>
      <div className="text-muted-foreground flex flex-col gap-4 text-base leading-relaxed">
        {children}
      </div>
    </div>
  );
}

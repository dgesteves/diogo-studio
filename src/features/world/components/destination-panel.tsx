import { type ReactElement, type ReactNode } from "react";

type DestinationPanelProps = {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
};

export function DestinationPanel({
  eyebrow,
  title,
  summary,
  children,
}: DestinationPanelProps): ReactElement {
  return (
    <article className="border-border/70 bg-background/80 supports-backdrop-filter:bg-background/60 pointer-events-auto w-full max-w-xl rounded-2xl border p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <p className="text-accent font-mono text-[11px] font-medium tracking-[0.18em] uppercase">
        {eyebrow}
      </p>
      <h1 className="text-foreground mt-3 text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-4 leading-relaxed">{summary}</p>
      <div className="mt-8">{children}</div>
    </article>
  );
}

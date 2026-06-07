import type { ReactElement } from "react";
import { StatusDot } from "@/components/ui/status-dot";
import { usesGroups } from "@/content/data/uses";

export function Uses(): ReactElement {
  return (
    <section role="region" aria-labelledby="uses-heading" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="console-grid mask-fade-edges pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="text-muted-foreground border-border bg-surface inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-wider uppercase">
            <StatusDot tone="good" />
            <span>Uses</span>
          </div>

          <h1
            id="uses-heading"
            className="text-foreground text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-medium tracking-tight text-balance"
          >
            Tools, hardware, editor, dotfiles.
          </h1>

          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance">
            A curated, not exhaustive, list of what I actually reach for day-to-day — and the stack
            this studio runs on.
          </p>
        </div>

        <div className="border-signal-warn/40 bg-signal-warn/5 flex items-start gap-3 rounded-lg border p-4">
          <StatusDot tone="warn" className="mt-1" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Items marked with an amber dot are placeholders pending confirmation of my exact gear.
            Everything else is verified from this repository&rsquo;s configuration.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {usesGroups.map((group) => (
            <div key={group.category} className="flex flex-col gap-4">
              <h2 className="text-subtle-foreground border-border border-b pb-3 font-mono text-[11px] font-medium tracking-wider uppercase">
                {group.category}
              </h2>
              <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
                {group.items.map((item) => (
                  <div key={item.name} className="bg-surface flex flex-col gap-1.5 p-4">
                    <dt className="text-foreground flex items-center gap-2 text-sm font-medium tracking-tight">
                      {item.pending ? <StatusDot tone="warn" /> : null}
                      {item.name}
                    </dt>
                    <dd className="text-muted-foreground text-sm leading-relaxed">{item.note}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

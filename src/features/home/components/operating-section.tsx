import type { ReactElement } from "react";
import { operatingAltitudes, type OperatingAltitude } from "@/features/home/constants/operating";

export function OperatingSection(): ReactElement {
  return (
    <section role="region" aria-labelledby="operating-heading" className="border-border border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 flex flex-col gap-2">
          <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
            Operating from three altitudes — within the last 18 months
          </p>
          <h2
            id="operating-heading"
            className="text-foreground max-w-3xl text-2xl leading-tight font-medium tracking-tight text-balance sm:text-3xl"
          >
            Equally comfortable as a Staff IC inside a large org and as a founding-engineer or VPE
            inside a fast-moving AI startup.
          </h2>
        </div>

        <ol className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
          {operatingAltitudes.map((altitude) => (
            <OperatingCard key={altitude.tag} {...altitude} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function OperatingCard({ tag, title, org, copy }: OperatingAltitude): ReactElement {
  return (
    <li className="bg-surface hover:bg-surface-muted flex flex-col gap-3 p-6 transition-colors">
      <span className="text-accent font-mono text-[10px] font-medium tracking-wider uppercase">
        {tag}
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-base font-medium tracking-tight">{title}</h3>
        <p className="text-muted-foreground font-mono text-[11px] tracking-wide">{org}</p>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">{copy}</p>
    </li>
  );
}

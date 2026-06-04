import type { ReactElement } from "react";
import { Studio } from "@/features/studio";

export function StudioSection(): ReactElement {
  return (
    <section role="region" aria-labelledby="studio-heading" className="border-border border-b">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-10 flex flex-col gap-3">
          <p className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase">
            The studio — present tense
          </p>
          <h2
            id="studio-heading"
            className="text-foreground max-w-3xl text-2xl leading-tight font-medium tracking-tight text-balance sm:text-3xl"
          >
            Three monitors, one focus. Live signals from the rig the work ships from.
          </h2>
        </div>

        <Studio />

        {/* Caption strip — names what each monitor is showing. Mono caps. */}
        <ul className="text-subtle-foreground mt-6 grid grid-cols-1 gap-3 font-mono text-[10px] tracking-wider uppercase sm:grid-cols-3 sm:gap-8">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="text-accent">
              ●
            </span>
            <span>LEFT · runtime — code in flight</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="text-accent">
              ●
            </span>
            <span>CENTER · ops.live — production telemetry</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="text-accent">
              ●
            </span>
            <span>RIGHT · signals — perf, latency, errors</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

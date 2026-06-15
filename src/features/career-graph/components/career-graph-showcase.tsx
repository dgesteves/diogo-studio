import type { ReactElement } from "react";
import { cn } from "@/lib/utils/cn";
import { CareerGraphAtmosphere } from "./career-graph";
import { CareerGraphAccessibleDescription } from "./career-graph-accessible-description";
import { CareerGraphSvg } from "./career-graph-svg";

const CAPTION_ID = "career-graph-caption";
const DESCRIPTION_ID = "career-graph-description";
const HEADING_ID = "career-graph-showcase-heading";

export function CareerGraphShowcase({ className }: { className?: string }): ReactElement {
  return (
    <section
      aria-labelledby={HEADING_ID}
      className={cn(
        "border-border/40 bg-surface/20 relative isolate overflow-hidden rounded-2xl border p-5 backdrop-blur-[2px] sm:p-6",
        className,
      )}
    >
      <CareerGraphAtmosphere className="-z-10" />
      <CareerGraphAccessibleDescription id={DESCRIPTION_ID} />

      <h2
        id={HEADING_ID}
        className="text-subtle-foreground font-mono text-[10px] font-medium tracking-wider uppercase"
      >
        Career graph — engagements connected by pattern themes
      </h2>

      <figure
        aria-labelledby={CAPTION_ID}
        aria-describedby={DESCRIPTION_ID}
        className="relative mt-4"
      >
        <span id={CAPTION_ID} className="sr-only">
          Career graph — engagements connected by pattern themes
        </span>
        <div className="relative" style={{ aspectRatio: "5 / 3" }}>
          <CareerGraphSvg ariaLabelledBy={CAPTION_ID} className="absolute inset-0" />
        </div>
        <figcaption className="text-subtle-foreground mt-3 flex items-center justify-between font-mono text-[10px] tracking-wider uppercase">
          <span>Career graph · 7 engagements · 5 patterns</span>
          <span aria-hidden="true" className="text-accent">
            ● live
          </span>
        </figcaption>
      </figure>
    </section>
  );
}

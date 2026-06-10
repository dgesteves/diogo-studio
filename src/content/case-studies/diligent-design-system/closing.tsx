import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";
import { Outcome } from "@/components/article/outcome";

export function Closing(): ReactElement {
  return (
    <>
      <H2>Outcomes</H2>
      <Outcome>
        Two runtimes (React + Angular) operating on a single token + contract spine, with a
        federated contribution model the central team could steward without becoming a bottleneck.
      </Outcome>
      <Outcome tag="Reach">
        The system shipped across the company’s governance product lines during my tenure and
        continued to evolve after I rolled off.
      </Outcome>
      <Outcome tag="Career outcome">
        Diligent is where I learned that the design system is the contribution model, not the
        components. That framing has shaped every DS conversation I’ve had since.
      </Outcome>
    </>
  );
}

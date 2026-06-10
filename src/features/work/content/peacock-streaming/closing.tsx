import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";
import { Outcome } from "@/components/article/outcome";

export function Closing(): ReactElement {
  return (
    <>
      <H2>Outcomes</H2>
      <Outcome>
        Shipped through the high-growth phase of Peacock’s web surface without my changes being
        the cause of a customer-visible incident during my tenure.
      </Outcome>
      <Outcome tag="Operating outcome">
        Helped install a release-safety culture (flags, canary, runbook drills) the team kept
        maintaining after I rolled off.
      </Outcome>
      <Outcome tag="What I took with me">
        The habits described above are the floor I bring to every senior role since. They are{" "}
        <em>the</em> reason I trust myself with streaming or agentic-scale surfaces.
      </Outcome>
    </>
  );
}

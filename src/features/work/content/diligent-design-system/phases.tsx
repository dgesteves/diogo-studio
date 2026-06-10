import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";
import { Phase, Timeline } from "@/components/article/timeline";

export function Phases(): ReactElement {
  return (
    <>
      <H2>Phases</H2>
      <Timeline>
        <Phase tag="Phase 01" title="One contract, two runtimes" dates="early 2019">
          Before any component shipped, we wrote the <em>contract</em> — props, accessibility
          behavior, slot conventions, lifecycle. Two implementations followed the same contract;
          products didn’t care which runtime they had.
        </Phase>
        <Phase tag="Phase 02" title="Tokens before components" dates="2019">
          Colors, type, spacing, motion landed first, as JSON consumed by Style Dictionary.
          Components became trivial once tokens were canonical; product teams could even ship
          without our library if they consumed the tokens.
        </Phase>
        <Phase tag="Phase 03" title="Governed federation" dates="2019–2020">
          Set up the contribution model: an RFC, a design review, a code review, an a11y review, a
          docs review. We were not a gatekeeper; we were the reviewers of the contract, and a
          steward of the composition rules.
        </Phase>
        <Phase tag="Phase 04" title="Adoption as pull" dates="2020">
          Migration was opt-in. Teams pulled the system at their own pace. The DS team’s job was
          making “pull” the obvious choice for any new screen, not enforcing it from above.
        </Phase>
      </Timeline>
    </>
  );
}

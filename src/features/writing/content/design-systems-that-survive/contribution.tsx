import type { ReactElement } from "react";
import { Callout } from "@/components/article/callout";
import { H3 } from "@/components/article/heading";

export function Contribution(): ReactElement {
  return (
    <>
      <H3>3. The contribution model is the system</H3>
      <p>
        This is the part teams miss. If a product team has a high-quality Banner they need next
        week, the system either lets them contribute it back or it loses adoption. Both options
        are choices; one is a strategy and one is an accident.
      </p>
      <p>A working contribution model has, at minimum:</p>
      <ul>
        <li>An RFC template. Two paragraphs is fine; the point is to think through it before code.</li>
        <li>A design review with the design system’s owners.</li>
        <li>
          A code review focused on the <em>contract</em>, not the bikeshed.
        </li>
        <li>
          An a11y review (if your products are regulated, this is the most critical of the four).
        </li>
        <li>A docs + Storybook entry.</li>
      </ul>
      <p>
        The central team doesn’t write the component. They review it. That’s the difference
        between gatekeeping and federation.
      </p>
      <H3>4. Accessibility is in the contract, not in the docs</H3>
      <p>
        A11y checklists in the docs are the design-system equivalent of “please be safe out
        there.” They are well-meaning, and they accomplish nothing.
      </p>
      <p>
        The way a11y survives the lifecycle of a system is by being a <em>contract behavior</em>:
        a Button without an accessible label fails TypeScript. A Modal without focus management
        fails review. A toggle without proper roles isn’t accepted into the system. The contract
        is the enforcement.
      </p>
      <H3>5. Tokens, components, contribution, adoption — in that order</H3>
      <p>
        Most systems do this in reverse. They ship 30 components first, then write tokens, then
        try to set up contribution, then beg for adoption. By the time they get to contribution,
        the system has accumulated enough opinions that no contribution can fit it.
      </p>
      <Callout tone="tip" title="The opinionated take">
        A design system that ships fewer components and a better contribution model will be the
        one that’s still alive five years later. The opposite never is.
      </Callout>
    </>
  );
}

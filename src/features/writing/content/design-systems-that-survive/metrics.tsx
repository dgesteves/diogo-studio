import type { ReactElement } from "react";
import { H2 } from "@/components/article/heading";

export function Metrics(): ReactElement {
  return (
    <>
      <H2>A note on metrics</H2>
      <p>
        People love DS adoption metrics. “70% of product surfaces use the Modal component.” Fine.
        They’re not what a senior reviewer should be looking at.
      </p>
      <p>The metrics that matter are operational:</p>
      <ul>
        <li>
          <strong>Contribution velocity</strong>: how often does someone outside the DS team
          contribute back? Once a quarter is a warning. Once a sprint is a healthy system.
        </li>
        <li>
          <strong>Token coverage</strong> (not component coverage): how many non-library products
          are pulling the tokens? This shows the actual reach of the design language.
        </li>
        <li>
          <strong>Contract churn</strong>: how often does a component’s contract change? Frequent
          churn means the contract was wrong; rare churn means it was right.
        </li>
      </ul>
      <p>Adoption rate is a vanity metric. Contribution rate is the real one.</p>
      <H2>The framing I keep coming back to</H2>
      <blockquote>
        <em>
          A design system is not a component library. It’s a contract for how products in this
          organization speak to their users.
        </em>
      </blockquote>
      <p>
        That framing changes what work matters. Component sprints become a side-effect of
        contract sprints. Adoption strategy becomes “make the system the obvious tool” instead of
        “mandate the system.” And contribution becomes the central activity, not an afterthought.
      </p>
      <p>
        If you’re hiring a Staff+ engineer to own a design system, the work they should describe —
        when you ask them about their last DS engagement — is contribution, contract, and
        federation. If they describe Buttons and Modals, they are at a more junior altitude than
        the role calls for. That’s the test.
      </p>
    </>
  );
}

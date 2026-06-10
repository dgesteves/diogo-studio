import type { ArticleBlock } from "@/content/schema/article-blocks";

export const metrics: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "A note on metrics" },
  {
    kind: "paragraph",
    text: 'People love DS adoption metrics. "70% of product surfaces use the Modal component." Fine. They\'re not what a senior reviewer should be looking at.',
  },
  { kind: "paragraph", text: "The metrics that matter are operational:" },
  {
    kind: "list",
    items: [
      "**Contribution velocity**: how often does someone outside the DS team contribute back? Once a quarter is a warning. Once a sprint is a healthy system.",
      "**Token coverage** (not component coverage): how many non-library products are pulling the tokens? This shows the actual reach of the design language.",
      "**Contract churn**: how often does a component's contract change? Frequent churn means the contract was wrong; rare churn means it was right.",
    ],
  },
  { kind: "paragraph", text: "Adoption rate is a vanity metric. Contribution rate is the real one." },
  { kind: "heading", level: 2, text: "The framing I keep coming back to" },
  {
    kind: "quote",
    text: "*A design system is not a component library. It's a contract for how products in this organization speak to their users.*",
  },
  {
    kind: "paragraph",
    text: 'That framing changes what work matters. Component sprints become a side-effect of contract sprints. Adoption strategy becomes "make the system the obvious tool" instead of "mandate the system." And contribution becomes the central activity, not an afterthought.',
  },
  {
    kind: "paragraph",
    text: "If you're hiring a Staff+ engineer to own a design system, the work they should describe — when you ask them about their last DS engagement — is contribution, contract, and federation. If they describe Buttons and Modals, they are at a more junior altitude than the role calls for. That's the test.",
  },
];

import type { ArticleBlock } from "@/content/schema/article-blocks";

export const decisions: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "Decisions" },
  {
    kind: "decisions",
    items: [
      {
        index: 1,
        title: "Tokens as the actual product",
        constraint:
          "Two runtimes, multiple product lines, one design language. A component library alone wouldn't bridge that.",
        options:
          "(a) ship components, hope products converge; (b) ship tokens + components together; (c) tokens as the canonical contract, components as one implementation of it.",
        choice:
          "(c) — tokens were the artifact other teams could consume even if they didn't adopt the component library.",
        outcome:
          "Two products that never adopted the library still picked up tokens and looked like the rest of the suite. The DS had impact beyond the seats that took the dependency.",
      },
      {
        index: 2,
        title: "Contract before implementation",
        constraint:
          "Writing the React and Angular libraries in parallel risked them diverging in subtle, unrecoverable ways.",
        options:
          "(a) one team writes both; (b) parallel teams; (c) parallel teams with a shared written contract reviewed before either implementation starts.",
        choice:
          "(c) — every component had a contract doc (props, slots, ARIA, focus, motion) before either implementation began.",
        outcome:
          "The two libraries stayed behaviorally consistent without an org-wide rewrite when one of them needed to catch up. The contract was the canonical artifact.",
      },
      {
        index: 3,
        title: "Federation over gatekeeping",
        constraint:
          "Product teams shipped faster than a central DS team could keep up. A gatekeeper model would have been a bottleneck.",
        options:
          "(a) gatekeeper team writes everything; (b) free-for-all contribution; (c) RFC-driven federation with a central review path.",
        choice:
          "(c) — product teams could propose, design, and contribute; the DS team owned the review and the composition rules.",
        outcome:
          "Velocity stayed high. Coherence didn't drift. Two product lines made meaningful contributions back to the system within the first year.",
      },
      {
        index: 4,
        title: "Accessibility as a non-overridable behavior, not a docs page",
        constraint:
          "In a governance product, a11y failures aren't a usability issue — they're a compliance issue.",
        options:
          "(a) docs + manual audits; (b) component-level a11y APIs only; (c) a11y baked into the component contract; props that violate it don't compile.",
        choice:
          "(c) — accessibility behavior was contract-level. Components without a label prop, focus management, or correct roles weren't accepted into the system.",
        outcome:
          "Audits passed without an emergency sprint. Teams stopped asking 'is this a11y?' and started asking 'does this match the system's behavior?'",
      },
    ],
  },
  {
    kind: "tradeoff",
    title: "Contract-first",
    gained:
      "Two runtimes that stayed coherent without an org-wide alignment exercise every quarter.",
    paid: "Slower start. The first six weeks shipped a lot of writing and very few components. Worth it once the rate of component-shipping crossed over.",
  },
  {
    kind: "callout",
    tone: "tip",
    title: "Design-systems lesson",
    body: "Design systems fail at federation, not at components. The work that determines success is contribution + review, not Button + Modal.",
  },
];

import type { ArticleBlock } from "@/content/schema/article-blocks";

export const closing: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "Outcomes" },
  {
    kind: "outcome",
    body: "Two runtimes (React + Angular) operating on a single token + contract spine, with a federated contribution model the central team could steward without becoming a bottleneck.",
  },
  {
    kind: "outcome",
    tag: "Reach",
    body: "The system shipped across the company's governance product lines during my tenure and continued to evolve after I rolled off.",
  },
  {
    kind: "outcome",
    tag: "Career outcome",
    body: "Diligent is where I learned that the design system is the contribution model, not the components. That framing has shaped every DS conversation I've had since.",
  },
];

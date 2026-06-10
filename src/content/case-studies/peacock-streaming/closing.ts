import type { ArticleBlock } from "@/content/schema/article-blocks";

export const closing: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "Outcomes" },
  {
    kind: "outcome",
    body: "Shipped through the high-growth phase of Peacock's web surface without my changes being the cause of a customer-visible incident during my tenure.",
  },
  {
    kind: "outcome",
    tag: "Operating outcome",
    body: "Helped install a release-safety culture (flags, canary, runbook drills) the team kept maintaining after I rolled off.",
  },
  {
    kind: "outcome",
    tag: "What I took with me",
    body: "The habits described above are the floor I bring to every senior role since. They are *the* reason I trust myself with streaming or agentic-scale surfaces.",
  },
];

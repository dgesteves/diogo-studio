import type { ArticleBlock } from "@/content/schema/article-blocks";

export const timeline: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "Timeline" },
  {
    kind: "timeline",
    phases: [
      {
        tag: "Phase 01",
        title: "The contract",
        dates: "Q3 2023",
        body: "Before any agent shipped, I drafted the GraphQL schema as if the agents already worked. That meant agreeing on the shape of a *site*, a *link*, and a *capacity estimate* with the RF lead, and making sure each one had an ID stable enough to survive multiple proposals. The UI became the forcing function for the backend.",
      },
      {
        tag: "Phase 02",
        title: "Map as state",
        dates: "Q4 2023",
        body: "Built the digital-twin map: tiles, terrain, line-of-sight, coverage polygons. The agents proposed shapes; the engineer promoted them; everything else was derived. Map state became the source of truth, agents were rendered as suggestions.",
      },
      {
        tag: "Phase 03",
        title: "The review loop",
        dates: "Q1 2024",
        body: 'Shipped the inspect/redo loop: every agent leg became a record on the plan with inputs, outputs, and a button to rerun. This is where agentic UX actually started to feel different from "chat with documents."',
      },
      {
        tag: "Phase 04",
        title: "Onboarding compression",
        dates: "2024–2025",
        body: "Tightened the brief intake so a sales call could turn into a workable plan inside a same-day workshop. The onboarding flow became the proof of the product, not a tutorial.",
      },
    ],
  },
];

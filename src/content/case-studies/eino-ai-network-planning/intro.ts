import type { ArticleBlock } from "@/content/schema/article-blocks";

export const intro: readonly ArticleBlock[] = [
  {
    kind: "paragraph",
    text: "This is a case study about building agentic UX in production — not a demo, not a hackathon. eino.ai's product compresses what a senior RF engineer does in a week into a working session: ingest a customer brief, draft sites, plan radio links, validate against terrain + line-of-sight, and hand the engineer a high-level design they can sign off on or revise.",
  },
  {
    kind: "paragraph",
    text: "My remit was the whole client side: an agent-aware React + GraphQL foundation, a digital-twin map surface, the human-in-the-loop review loop that keeps the agent honest, and a contract with the backend crisp enough to absorb model swaps without UI rewrites.",
  },
  {
    kind: "metrics",
    items: [
      {
        label: "Capacity model",
        value: "Live",
        unit: "per session",
        tone: "accent",
        hint: "Agents re-cost the plan as the engineer edits.",
        sparkline: {
          values: [12, 13, 11, 14, 18, 17, 19, 22, 24, 23, 26, 28],
          tone: "accent",
          ariaLabel: "Capacity over time",
        },
      },
      {
        label: "Iteration latency",
        value: "Sub-second",
        unit: "UI feedback",
        tone: "good",
        hint: "Edits resolve before the agent finishes its trace.",
        sparkline: {
          values: [40, 38, 36, 34, 30, 26, 24, 22, 20, 19, 18, 17],
          tone: "good",
          ariaLabel: "Latency over time",
        },
      },
      {
        label: "Tile budget",
        value: "< 220",
        unit: "KB / view",
        tone: "default",
        hint: "Lazy-loaded geospatial chunks; budget-enforced in CI.",
      },
      {
        label: "Agent failures",
        value: "Recoverable",
        unit: "by design",
        tone: "warn",
        hint: "Every step is rewindable; the user can rerun any leg.",
      },
    ],
  },
  {
    kind: "stack",
    label: "Surface area",
    items: [
      "Next.js (App Router)",
      "React 19",
      "TypeScript strict",
      "GraphQL Codegen",
      "MapLibre + custom layers",
      "Turf.js",
      "TanStack Query",
      "Radix + cva",
    ],
  },
];

import type { ArticleBlock } from "@/content/schema/article-blocks";

export const closing: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "What this looked like to the engineer" },
  {
    kind: "paragraph",
    text: "The hero of the product is the map. The agents are the supporting cast. That distinction shaped every UI decision: the map was the surface that held attention; agent panels were edges of the workspace that lit up when something needed acceptance.",
  },
  {
    kind: "callout",
    tone: "tip",
    title: "Agentic UX, the rule we settled on",
    body: "Anything an agent does has to be inspectable, rerunnable, and attributable. The UI can be magical; the contract underneath cannot.",
  },
  { kind: "heading", level: 2, text: "Outcomes" },
  {
    kind: "outcome",
    body: "Same-day workshops replaced multi-week consulting engagements for the customer profile the product was designed for.",
  },
  {
    kind: "outcome",
    tag: "Operating outcome",
    body: "The contract held across three LLM provider swaps. The frontend shipped through them without a single visible regression to pilot customers — what the agent-orchestration team needed me to do.",
  },
  {
    kind: "outcome",
    tag: "Career outcome",
    body: 'This is the engagement I reference when people ask "have you actually shipped agentic UX, or just talked about it?"',
  },
];

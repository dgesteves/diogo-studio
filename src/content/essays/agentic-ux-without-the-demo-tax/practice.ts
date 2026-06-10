import type { ArticleBlock } from "@/content/schema/article-blocks";

export const practice: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "What this looks like in practice" },
  { kind: "paragraph", text: "The architecture isn't complicated. The discipline is." },
  {
    kind: "tradeoff",
    title: "Editor-first vs chat-first",
    gained:
      "Engineers can sit with the agent for hours without losing trust. The plan is a real artifact they can share, version, and revisit.",
    paid: "More UI surface to design and build. The chat-only path is genuinely less work — it's also a less useful product.",
  },
  {
    kind: "paragraph",
    text: "For most teams shipping agentic features in 2025, the question isn't \"can we get the LLM to do the thing.\" That part is solved. The question is whether the UI around it is honest enough about the LLM's failure modes that engineers stop dropping out after the demo.",
  },
  { kind: "heading", level: 2, text: "The framing I keep coming back to" },
  {
    kind: "quote",
    text: "*Anything an agent does has to be inspectable, rerunnable, and attributable. The UI can be magical; the contract underneath cannot.*",
  },
  {
    kind: "paragraph",
    text: "Every agentic surface I've seen succeed in production has obeyed that rule. Most of the demos I see weekly are still operating on the opposite assumption — that the user will hand-wave at the agent's output if the loading animation is sufficiently impressive.",
  },
  {
    kind: "paragraph",
    text: "If you're building one of these surfaces, the test is straightforward: **can a skeptical engineer use the product for a full day without losing trust in it?** If yes, you have a product. If no, you have a demo. There's no middle category, and there's no time-on-the-market shortcut around the difference.",
  },
];

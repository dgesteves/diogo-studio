import type { ArticleBlock } from "@/content/schema/article-blocks";

export const intro: readonly ArticleBlock[] = [
  {
    kind: "paragraph",
    text: 'Most "AI" interfaces I see in 2025 are demos with a router. They ship a chat surface, attach a tool-use loop, and call it agentic. They look impressive in a 90-second sales call. They become useless in hour two of the engineer\'s actual workday.',
  },
  {
    kind: "paragraph",
    text: "This is what I mean by **the demo tax**: the cost of building a product whose primary success metric is its ability to be demoed, rather than its ability to be lived in. You can ship a lot of demos before you notice you're not shipping a product.",
  },
];

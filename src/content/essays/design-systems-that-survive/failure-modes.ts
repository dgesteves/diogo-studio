import type { ArticleBlock } from "@/content/schema/article-blocks";

export const failureModes: readonly ArticleBlock[] = [
  {
    kind: "paragraph",
    text: "I have been the lead frontend engineer on design systems at three companies. The first one outlived me. The second one is the one I think about most when I write this. The third one is still in flight.",
  },
  {
    kind: "paragraph",
    text: "Here's what I've learned about the systems that *survive* — not the ones that launch with a fancy Storybook, but the ones that are still used three product cycles later — by separating the wheat from the chaff.",
  },
  { kind: "heading", level: 2, text: "The failure mode is never components" },
  {
    kind: "paragraph",
    text: 'If you go on the internet looking for advice about enterprise design systems, almost all of it is about *components*: what variants the Button has, whether the Modal traps focus, whether the Tabs use `role="tablist"`. This is fine, but it isn\'t the work. Every enterprise DS I\'ve seen ships those.',
  },
  { kind: "paragraph", text: "The systems that **die** die at one of three places:" },
  {
    kind: "decisions",
    items: [
      {
        index: 1,
        title: "They die at contribution",
        constraint: "Product teams ship faster than the central DS team can keep up.",
        options: "(a) gatekeep harder; (b) ship faster from the center; (c) federate, with a real review model.",
        choice: "(c) — anything else builds a queue that ends in a re-org.",
        outcome:
          "Federated systems survive because contribution is shared work, not a request to a central team.",
      },
      {
        index: 2,
        title: "They die at framework drift",
        constraint: "The org has two stacks; the DS is built for one.",
        options:
          "(a) ignore the other stack; (b) port; (c) ship a contract that compiles to both runtimes from one source.",
        choice: "(c) — tokens + behavior contract + two implementations.",
        outcome:
          "The systems that survive a Big Migration are the ones that already weren't pinned to one framework.",
      },
      {
        index: 3,
        title: "They die at adoption",
        constraint:
          "Adoption is push, not pull. Teams resist; the central team escalates; everyone hates each other.",
        options: "(a) mandate adoption; (b) hope; (c) make 'pull' the obvious choice for every new screen.",
        choice:
          "(c) — adoption follows utility. If the system isn't the obvious tool, nothing organizational will save it.",
        outcome: "Pull adoption looks slow for the first six months. Then it's faster than push ever was.",
      },
    ],
  },
  {
    kind: "paragraph",
    text: "If you can name a design system that died, I can almost certainly trace it back to one of these three.",
  },
];

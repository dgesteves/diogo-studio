import type { ArticleBlock } from "@/content/schema/article-blocks";

export const actualWork: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "The actual work, in order" },
  { kind: "heading", level: 3, text: "1. Tokens come first, and they are the product" },
  {
    kind: "paragraph",
    text: "Colors, type, spacing, motion, radius — declared once, in a runtime-agnostic format (JSON is fine; we don't need a magic format). This is the *contract*. Components are one consumer of it; products that won't adopt the component library can still consume the tokens and look like the rest of the suite.",
  },
  {
    kind: "paragraph",
    text: "Tokens being the product means a design language can spread further than your library can. That's a feature.",
  },
  { kind: "heading", level: 3, text: "2. A contract is written before code" },
  {
    kind: "paragraph",
    text: "For every component, write a doc: props, slots, ARIA, focus behavior, motion, edge cases. Both the React and the Angular team (or Vue, or whatever) implement *that doc*. The doc, not either implementation, is the canonical artifact.",
  },
  {
    kind: "paragraph",
    text: "Contract-first sounds slow. The first six weeks ship very few components. After that it's faster than the alternative — and the divergence problem doesn't exist.",
  },
  { kind: "heading", level: 3, text: "3. The contribution model is the system" },
  {
    kind: "paragraph",
    text: "This is the part teams miss. If a product team has a high-quality Banner they need next week, the system either lets them contribute it back or it loses adoption. Both options are choices; one is a strategy and one is an accident.",
  },
  { kind: "paragraph", text: "A working contribution model has, at minimum:" },
  {
    kind: "list",
    items: [
      "An RFC template. Two paragraphs is fine; the point is to think through it before code.",
      "A design review with the design system's owners.",
      "A code review focused on the *contract*, not the bikeshed.",
      "An a11y review (if your products are regulated, this is the most critical of the four).",
      "A docs + Storybook entry.",
    ],
  },
  {
    kind: "paragraph",
    text: "The central team doesn't write the component. They review it. That's the difference between gatekeeping and federation.",
  },
  { kind: "heading", level: 3, text: "4. Accessibility is in the contract, not in the docs" },
  {
    kind: "paragraph",
    text: 'A11y checklists in the docs are the design-system equivalent of "please be safe out there." They are well-meaning, and they accomplish nothing.',
  },
  {
    kind: "paragraph",
    text: "The way a11y survives the lifecycle of a system is by being a *contract behavior*: a Button without an accessible label fails TypeScript. A Modal without focus management fails review. A toggle without proper roles isn't accepted into the system. The contract is the enforcement.",
  },
  {
    kind: "heading",
    level: 3,
    text: "5. Tokens, components, contribution, adoption — in that order",
  },
  {
    kind: "paragraph",
    text: "Most systems do this in reverse. They ship 30 components first, then write tokens, then try to set up contribution, then beg for adoption. By the time they get to contribution, the system has accumulated enough opinions that no contribution can fit it.",
  },
  {
    kind: "callout",
    tone: "tip",
    title: "The opinionated take",
    body: "A design system that ships fewer components and a better contribution model will be the one that's still alive five years later. The opposite never is.",
  },
];

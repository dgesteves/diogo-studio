import type { ArticleBlock } from "@/content/schema/article-blocks";

export const architecture: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "Architecture" },
  {
    kind: "diagram",
    title: "Diligent design system contract",
    description:
      "Tokens compile to two runtimes; React + Angular libraries expose the same contract; product apps consume them; contributions flow through a single review path.",
    caption:
      "The token + contract layer is the spine; runtimes are interchangeable; contributions are governed, not gated.",
    data: {
      nodes: [
        { id: "tokens", label: "Tokens", kind: "data", detail: "JSON · single source", x: 50, y: 10 },
        { id: "sd", label: "Style Dictionary", kind: "service", detail: "Build pipeline", x: 50, y: 38 },
        { id: "react", label: "React lib", kind: "client", detail: "Versioned package", x: 18, y: 68 },
        { id: "ng", label: "Angular lib", kind: "client", detail: "Versioned package", x: 82, y: 68 },
        { id: "products", label: "Product apps", kind: "external", detail: "Pull adoption", x: 50, y: 92 },
        { id: "rfc", label: "Contribution flow", kind: "agent", detail: "RFC + design + review", x: 18, y: 18 },
      ],
      edges: [
        { id: "e1", from: "tokens", to: "sd", label: "compile" },
        { id: "e2", from: "sd", to: "react", label: "build" },
        { id: "e3", from: "sd", to: "ng", label: "build" },
        { id: "e4", from: "react", to: "products", label: "consume" },
        { id: "e5", from: "ng", to: "products", label: "consume" },
        { id: "e6", from: "rfc", to: "tokens", variant: "dashed", label: "propose" },
        { id: "e7", from: "rfc", to: "react", variant: "dashed" },
        { id: "e8", from: "rfc", to: "ng", variant: "dashed" },
      ],
    },
  },
  { kind: "heading", level: 2, text: "Phases" },
  {
    kind: "timeline",
    phases: [
      {
        tag: "Phase 01",
        title: "One contract, two runtimes",
        dates: "early 2019",
        body: "Before any component shipped, we wrote the *contract* — props, accessibility behavior, slot conventions, lifecycle. Two implementations followed the same contract; products didn't care which runtime they had.",
      },
      {
        tag: "Phase 02",
        title: "Tokens before components",
        dates: "2019",
        body: "Colors, type, spacing, motion landed first, as JSON consumed by Style Dictionary. Components became trivial once tokens were canonical; product teams could even ship without our library if they consumed the tokens.",
      },
      {
        tag: "Phase 03",
        title: "Governed federation",
        dates: "2019–2020",
        body: "Set up the contribution model: an RFC, a design review, a code review, an a11y review, a docs review. We were not a gatekeeper; we were the reviewers of the contract, and a steward of the composition rules.",
      },
      {
        tag: "Phase 04",
        title: "Adoption as pull",
        dates: "2020",
        body: "Migration was opt-in. Teams pulled the system at their own pace. The DS team's job was making \"pull\" the obvious choice for any new screen, not enforcing it from above.",
      },
    ],
  },
];

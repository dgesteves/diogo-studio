import { routes } from "@/constants/routes";
import type { Destination } from "../types";

export const stanceDestinations: readonly Destination[] = [
  {
    slug: "now",
    href: routes.now,
    label: "Now",
    eyebrow: "Present tense",
    title: "What I'm focused on right now.",
    summary: "A snapshot of what Diogo Esteves is building, learning, and optimizing for today.",
    blocks: [
      {
        kind: "lede",
        text: "Leading frontend architecture for enterprise-grade web applications at Fueled — setting technical direction across React, TypeScript, design systems, and AI integrations.",
      },
      {
        kind: "list",
        title: "Currently",
        items: [
          "Shipping production AI-powered enterprise platforms.",
          "Translating ambiguous client requirements into maintainable architectures.",
          "Improving engineering velocity, observability, and developer experience.",
          "Building this studio — an interactive 3D portfolio world.",
        ],
      },
    ],
  },
  {
    slug: "principles",
    href: routes.principles,
    label: "Principles",
    eyebrow: "How I build",
    title: "The non-negotiables behind the work.",
    summary:
      "Engineering principles Diogo Esteves applies across platforms, teams, and product lines.",
    blocks: [
      {
        kind: "cards",
        items: [
          {
            title: "Systems thinking",
            meta: "Architecture",
            body: "Turn product ambiguity into composable, evolvable architectures that survive multiple product lines.",
          },
          {
            title: "Accessibility is a requirement",
            meta: "WCAG",
            body: "Semantic HTML, keyboard support, visible focus. A11y is a gate, never a polish step.",
          },
          {
            title: "Performance is a feature",
            meta: "Core Web Vitals",
            body: "Bundle budgets, runtime optimization, and release safety — measured, not assumed.",
          },
          {
            title: "AI that ships",
            meta: "AI-native",
            body: "Agentic UX and RAG-backed flows that hold up in production, not just in demos.",
          },
          {
            title: "RFC-driven decisions",
            meta: "Leadership",
            body: "Technical strategy in the open — leveling, hiring bar, and roadmaps the team can reason about.",
          },
          {
            title: "Developer experience",
            meta: "DX",
            body: "Typed contracts, CI/CD, and observability so teams stay unblocked and fast.",
          },
        ],
      },
    ],
  },
] as const;

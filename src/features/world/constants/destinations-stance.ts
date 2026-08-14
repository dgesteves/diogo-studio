import { getStationEntry } from "@/content/pages";
import type { Destination } from "../types";

export const stanceDestinations: readonly Destination[] = [
  {
    ...getStationEntry("now"),
    eyebrow: "Present tense",
    title: "What I'm focused on right now.",
    summary: "A snapshot of what Diogo Esteves is building, learning, and optimizing for today.",
    blocks: [
      {
        kind: "lede",
        text: "Leading web-application engineering at Fueled — the senior frontend voice on enterprise engagements across AI, media, and digital transformation.",
      },
      {
        kind: "list",
        title: "Currently",
        items: [
          "Shipping AI-augmented surfaces for enterprise audiences: LLM-driven workflows, content intelligence, internal tooling.",
          "Balancing delivery timelines against long-term maintainability across parallel engagements.",
          "Raising the bar on velocity, code quality, observability, and developer experience.",
          "Building this studio in the open — an interactive 3D portfolio world on R3F and Next.js.",
        ],
      },
      {
        kind: "list",
        title: "Learning & sharpening",
        items: [
          "Eval tooling for agentic workflows.",
          "WebGL performance budgets for content-heavy scenes.",
        ],
      },
    ],
  },
  {
    ...getStationEntry("principles"),
    eyebrow: "How I build",
    title: "The non-negotiables behind the work.",
    summary:
      "Engineering principles Diogo Esteves applies across platforms, teams, and product lines.",
    blocks: [
      {
        kind: "cards",
        items: [
          {
            title: "The frontend is the product",
            meta: "Strategy",
            body: "Treat the surface users touch as the business — never a thin layer over an API.",
          },
          {
            title: "Systems over heroics",
            meta: "Architecture",
            body: "Turn ambiguity into composable, evolvable architectures that survive multiple product lines and team changes.",
          },
          {
            title: "AI that ships",
            meta: "AI-native",
            body: "Agentic UX, RAG-backed flows, and human-in-the-loop review that hold up in production, not just in demos.",
          },
          {
            title: "Accessibility is a gate",
            meta: "WCAG",
            body: "Semantic HTML, keyboard support, visible focus — a requirement inherited from boardroom and broadcast-grade software.",
          },
          {
            title: "Performance is a feature",
            meta: "Core Web Vitals",
            body: "Bundle budgets, runtime optimization, and release safety — measured, not assumed. Learned at streaming scale.",
          },
          {
            title: "Decide in the open",
            meta: "Leadership",
            body: "RFCs, leveling rubrics, and roadmaps the whole team can reason about. High trust, async, shipping-oriented.",
          },
        ],
      },
    ],
  },
] as const;

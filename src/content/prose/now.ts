import { getStationEntry } from "../pages";
import type { Destination } from "../schema";

export const now: Destination = {
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
};

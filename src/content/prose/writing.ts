import { getStationEntry } from "../pages";
import type { Destination } from "../schema";

export const writing: Destination = {
  ...getStationEntry("writing"),
  eyebrow: "Field notes",
  title: "Notes on platforms, AI, and engineering leadership.",
  summary:
    "Essays and field notes from Diogo Esteves on frontend platforms, AI-native UX, and leadership.",
  blocks: [
    {
      kind: "lede",
      text: "Field notes from eleven years of platform work — drafted between shipping cycles, published when they're worth your time.",
    },
    {
      kind: "cards",
      items: [
        {
          title: "Design systems that survive their founders",
          meta: "Platform",
          body: "What makes a component library outlast the product line — and the people — it was born with.",
        },
        {
          title: "Agentic UX, honestly",
          meta: "AI",
          body: "What breaks when LLM workflows meet real users, and the human-in-the-loop patterns that hold.",
        },
        {
          title: "From IC to VPE and back",
          meta: "Leadership",
          body: "What changes — and what doesn't — when you move between engineering altitudes in eighteen months.",
        },
        {
          title: "The frontend is the product",
          meta: "Strategy",
          body: "Why treating the UI as a thin layer over an API is how good products quietly die.",
        },
      ],
    },
    {
      kind: "lede",
      text: "These essays are in the drafting queue. Until they land, the work speaks first.",
    },
  ],
};

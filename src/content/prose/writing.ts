import "server-only";

import { getStationEntry, routes } from "../pages";
import type { Page } from "../schema";

export const writing: Page = {
  ...getStationEntry("writing"),
  eyebrow: "Field notes",
  title: "Notes on platforms, AI, and engineering leadership.",
  summary:
    "The arguments Diogo Esteves keeps making about frontend platforms, AI-native UX, and leadership.",
  blocks: [
    {
      id: "intro",
      kind: "lede",
      text: "Nothing is published here yet. What follows is what I would write about — the arguments I keep making in RFCs, design reviews, and hiring conversations after eleven years of platform work.",
    },
    {
      id: "themes",
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
      id: "elsewhere",
      kind: "links",
      items: [
        { label: "The short version", href: routes.principles },
        { label: "Ask me about any of these", href: routes.contact },
      ],
    },
  ],
};

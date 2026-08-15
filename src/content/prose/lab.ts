import "server-only";

import { getStationEntry, routes } from "../pages";
import type { Page } from "../schema";

export const lab: Page = {
  ...getStationEntry("lab"),
  eyebrow: "R&D",
  title: "The questions I'm still chewing on.",
  summary:
    "Open engineering questions Diogo Esteves is working through — AI tooling and interface R&D.",
  blocks: [
    {
      id: "intro",
      kind: "lede",
      text: "Nothing here is a product, and none of it is finished. These are the open questions behind the work — the ones I read about, prototype against, and argue over. One of them graduated: it is the studio you're standing in.",
    },
    {
      id: "questions",
      kind: "cards",
      items: [
        {
          title: "Agentic eval harnesses",
          meta: "AI",
          body: "How do you measure whether an agentic workflow holds up under real-world inputs, rather than curated demos?",
        },
        {
          title: "Streaming UI primitives",
          meta: "Performance",
          body: "Which Suspense-driven patterns actually survive data-heavy, low-latency interfaces at streaming scale?",
        },
        {
          title: "Spatial navigation",
          meta: "3D",
          body: "Can information architecture map onto navigable 3D space without costing reach, speed, or accessibility? This site is the experiment.",
        },
      ],
    },
    {
      id: "next",
      kind: "links",
      items: [
        { label: "The one that shipped", href: routes.playground },
        { label: "Argue with me about any of these", href: routes.contact },
      ],
    },
  ],
};

import "server-only";

import { getStationEntry } from "../pages";
import type { Destination } from "../schema";

export const lab: Destination = {
  ...getStationEntry("lab"),
  eyebrow: "R&D",
  title: "Half-finished ideas, in the open.",
  summary: "Research and development explorations by Diogo Esteves — AI tooling and interface R&D.",
  blocks: [
    {
      kind: "cards",
      items: [
        {
          title: "Agentic eval harnesses",
          meta: "AI",
          body: "Tooling to measure whether agentic workflows hold up under real-world inputs — not just curated demos.",
        },
        {
          title: "Streaming UI primitives",
          meta: "Performance",
          body: "Suspense-driven components for data-heavy, low-latency interfaces, distilled from streaming-scale work.",
        },
        {
          title: "Spatial navigation",
          meta: "3D",
          body: "Mapping information architecture onto navigable 3D space — the research behind this studio.",
        },
      ],
    },
    {
      kind: "lede",
      text: "Experiments here are rough on purpose. The good ones graduate to the playground; the best ones ship for clients.",
    },
  ],
};

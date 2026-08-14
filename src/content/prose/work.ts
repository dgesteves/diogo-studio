import "server-only";

import { workTimeline } from "../career-timeline";
import { getStationEntry } from "../pages";
import type { Destination } from "../schema";

export const work: Destination = {
  ...getStationEntry("work"),
  eyebrow: "Selected experience",
  title: "Eleven years on the surfaces users touch.",
  summary:
    "Selected engineering experience of Diogo Esteves across streaming, governance, automotive, and AI-native platforms.",
  blocks: [
    {
      kind: "lede",
      text: "From Big Four consulting to Fortune-class streaming to VP-level ownership inside AI-native startups — the constant is the surface users touch and the platform underneath it.",
    },
    {
      kind: "timeline",
      items: workTimeline,
    },
  ],
};

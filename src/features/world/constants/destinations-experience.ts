import { getStationEntry } from "@/content/pages";
import type { Destination } from "../types";
import { workTimeline } from "./work-timeline";

export const experienceDestinations: readonly Destination[] = [
  {
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
  },
] as const;

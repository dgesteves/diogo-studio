import { getStationEntry } from "@/content/pages";
import { routes } from "@/content/pages";
import { siteConfig } from "@/config/site";
import type { Destination } from "../types";

export const openSourceDestinations: readonly Destination[] = [
  {
    ...getStationEntry("openSource"),
    eyebrow: "In the open",
    title: "Where the patterns get distilled.",
    summary: "Open-source work and experiments by Diogo Esteves.",
    blocks: [
      {
        kind: "lede",
        text: "Most of my production work ships behind enterprise walls. Open source is where the reusable patterns get extracted and shared.",
      },
      {
        kind: "list",
        title: "On the bench",
        items: [
          "Design-token pipelines and system primitives.",
          "React + Three.js interaction patterns — including the ones powering this studio.",
          "Typed contracts and scaffolding for AI-native frontends.",
        ],
      },
      {
        kind: "links",
        items: [
          { label: "GitHub — @dgesteves", href: siteConfig.links.github, external: true },
          { label: "This studio's playground", href: routes.playground },
        ],
      },
    ],
  },
] as const;

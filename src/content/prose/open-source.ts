import "server-only";

import { getStationEntry, routes } from "../pages";
import { siteConfig } from "../profile";
import type { Page } from "../schema";

export const openSource: Page = {
  ...getStationEntry("openSource"),
  eyebrow: "In the open",
  title: "Where the patterns would get distilled.",
  summary: "Open-source work and reusable patterns from Diogo Esteves.",
  blocks: [
    {
      id: "why",
      kind: "lede",
      text: "Eleven years of production work, almost all of it behind enterprise walls or an NDA. There is no substantial public catalogue to point at yet — the honest state of things — so what follows is what would be worth extracting first.",
    },
    {
      id: "worth-extracting",
      kind: "list",
      title: "Worth extracting",
      items: [
        "Design-token pipelines and system primitives.",
        "React + Three.js interaction patterns — including the ones powering this studio.",
        "Typed contracts and scaffolding for AI-native frontends.",
      ],
    },
    {
      id: "elsewhere",
      kind: "links",
      items: [
        { label: "GitHub — @dgesteves", href: siteConfig.links.github, external: true },
        { label: "The patterns, running live", href: routes.playground },
      ],
    },
  ],
};

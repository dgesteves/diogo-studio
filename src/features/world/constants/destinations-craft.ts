import { routes } from "@/constants/routes";
import { siteConfig } from "@/config/site";
import type { Destination } from "../types";

export const craftDestinations: readonly Destination[] = [
  {
    slug: "writing",
    href: routes.writing,
    label: "Writing",
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
  },
  {
    slug: "speaking",
    href: routes.speaking,
    label: "Speaking",
    eyebrow: "Stage & community",
    title: "Sharing the craft with the community.",
    summary: "Talks, mentoring, and community leadership by Diogo Esteves.",
    blocks: [
      {
        kind: "list",
        title: "Talks I give",
        items: [
          "Frontend platforms and design systems at enterprise scale.",
          "Agentic UX — shipping AI-native products beyond the demo.",
          "From prototype velocity to production reliability.",
        ],
      },
      {
        kind: "list",
        title: "Community",
        items: [
          "Technical interviewing and hiring-bar calibration.",
          "Mentoring engineers from mid-level to Staff.",
          "Engineering coaching for founders and early teams.",
        ],
      },
      {
        kind: "lede",
        text: "Available for talks, panels, and podcasts — in English or Portuguese, on stage or remote.",
      },
      {
        kind: "links",
        items: [
          { label: "Invite me to speak", href: `mailto:${siteConfig.email}`, external: true },
        ],
      },
    ],
  },
] as const;

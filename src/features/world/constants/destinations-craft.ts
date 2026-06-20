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
        kind: "cards",
        items: [
          {
            title: "Design systems that survive",
            meta: "Platform",
            body: "What makes a component library outlast the product line it was born in.",
          },
          {
            title: "Agentic UX, honestly",
            meta: "AI",
            body: "Designing AI workflows that hold up in production instead of impressing only in demos.",
          },
          {
            title: "From IC to VPE and back",
            meta: "Leadership",
            body: "What changes — and what doesn't — when you move between altitudes.",
          },
        ],
      },
      { kind: "lede", text: "More essays are on the way. Until then, the work speaks first." },
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
        title: "Community",
        items: [
          "Founder, WebDevPortugal.",
          "President & Co-Founder, Northern Grade E-Sports.",
          "Technical interviewing, mentoring, and engineering coaching.",
        ],
      },
      {
        kind: "lede",
        text: "Available for talks and panels on frontend platforms, AI-native product engineering, and scaling engineering teams.",
      },
      {
        kind: "links",
        items: [
          { label: "Invite me to speak", href: `mailto:${siteConfig.email}`, external: true },
        ],
      },
    ],
  },
  {
    slug: "openSource",
    href: routes.openSource,
    label: "Open source",
    eyebrow: "In the open",
    title: "Tools, experiments, and contributions.",
    summary: "Open-source work and experiments by Diogo Esteves.",
    blocks: [
      {
        kind: "list",
        title: "Themes",
        items: [
          "Design-system primitives and tokens.",
          "React + Three.js interaction patterns.",
          "Developer tooling and typed contracts.",
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

import "server-only";

import { getStationEntry } from "../pages";
import { siteConfig } from "../profile";
import type { Page } from "../schema";

export const speaking: Page = {
  ...getStationEntry("speaking"),
  eyebrow: "Stage & community",
  title: "Sharing the craft with the community.",
  summary: "What Diogo Esteves speaks about, and the community work behind it.",
  blocks: [
    {
      id: "intro",
      kind: "lede",
      text: "No conference record to list — this is what I'd take on stage, and what I already do off it.",
    },
    {
      id: "talks",
      kind: "list",
      title: "What I speak about",
      items: [
        "Frontend platforms and design systems at enterprise scale.",
        "Agentic UX — shipping AI-native products beyond the demo.",
        "From prototype velocity to production reliability.",
      ],
    },
    {
      id: "community",
      kind: "list",
      title: "Already doing",
      items: [
        "Technical interviewing and hiring-bar calibration.",
        "Mentoring engineers from mid-level to Staff.",
        "Engineering coaching for founders and early teams.",
      ],
    },
    {
      id: "availability",
      kind: "lede",
      text: "Available for talks, panels, and podcasts — in English or Portuguese, on stage or remote.",
    },
    {
      id: "invite",
      kind: "links",
      items: [{ label: "Invite me to speak", href: `mailto:${siteConfig.email}`, external: true }],
    },
  ],
};

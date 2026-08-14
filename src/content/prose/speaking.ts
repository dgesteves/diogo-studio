import { getStationEntry } from "../pages";
import { siteConfig } from "../profile";
import type { Destination } from "../schema";

export const speaking: Destination = {
  ...getStationEntry("speaking"),
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
      items: [{ label: "Invite me to speak", href: `mailto:${siteConfig.email}`, external: true }],
    },
  ],
};

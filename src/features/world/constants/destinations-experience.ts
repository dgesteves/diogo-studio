import { routes } from "@/constants/routes";
import type { Destination } from "../types";

export const experienceDestinations: readonly Destination[] = [
  {
    slug: "work",
    href: routes.work,
    label: "Work",
    eyebrow: "Selected experience",
    title: "Eleven years on the surfaces users touch.",
    summary:
      "Selected engineering experience of Diogo Esteves across streaming, governance, automotive, and AI-native platforms.",
    blocks: [
      {
        kind: "timeline",
        items: [
          {
            period: "Dec 2025 — Present",
            title: "Lead Engineer, Web Applications",
            org: "Fueled · Remote",
            points: [
              "Lead frontend architecture for enterprise-grade web applications.",
              "Set technical direction across React, TypeScript, design systems, and AI integrations.",
            ],
          },
          {
            period: "Jun 2025 — Dec 2025",
            title: "VP of Engineering",
            org: "Moment · Remote",
            points: [
              "Owned technical vision and the engineering organization.",
              "Architected AI-powered ingestion, retrieval, and automation systems.",
            ],
          },
          {
            period: "Feb 2023 — Jun 2025",
            title: "Lead Frontend Engineer",
            org: "eino.ai · Remote",
            points: [
              "Led frontend architecture for an agentic network-planning platform.",
              "Built digital-twin visualizations and AI-assisted RF engineering interfaces.",
            ],
          },
          {
            period: "Oct 2020 — Mar 2022",
            title: "Senior Software Engineer",
            org: "Sky (NBCUniversal / Comcast)",
            points: [
              "Built React/Redux apps at multi-million-user scale on Peacock TV.",
              "Improved performance, monitoring, and release safety.",
            ],
          },
          {
            period: "Aug 2019 — Oct 2020",
            title: "Lead Frontend Engineer",
            org: "Diligent · Remote",
            points: [
              "Architected the enterprise design system.",
              "Built reusable React and Angular component libraries.",
            ],
          },
          {
            period: "2016 — 2019",
            title: "Lead / Software Engineer",
            org: "BMW Group · Deloitte",
            points: [
              "Led innovation platforms on Angular and .NET Core at BMW.",
              "Built enterprise web apps and data visualizations at Deloitte.",
            ],
          },
        ],
      },
    ],
  },
] as const;

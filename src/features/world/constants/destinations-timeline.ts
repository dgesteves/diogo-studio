import { routes } from "@/constants/routes";
import type { Destination } from "../types";

export const timelineDestinations: readonly Destination[] = [
  {
    slug: "timeline",
    href: routes.timeline,
    label: "Timeline",
    eyebrow: "The long arc",
    title: "From law school to leading AI-native platforms.",
    summary: "The chronological career and education timeline of Diogo Esteves.",
    blocks: [
      {
        kind: "timeline",
        items: [
          {
            period: "2011 — 2015",
            title: "Foundations",
            org: "Universidade Lusófona · ISEL",
            points: [
              "LLB in Law, then pivoted to Computer Engineering.",
              "Studied software engineering, AI, and interactive systems.",
            ],
          },
          {
            period: "2016 — 2018",
            title: "Deloitte",
            org: "Software Engineer · Lisbon",
            points: [
              "React/Redux frontends backed by .NET MVC.",
              "Enterprise data visualizations.",
            ],
          },
          {
            period: "2018 — 2020",
            title: "BMW Group → Diligent",
            org: "Lead Frontend Engineer",
            points: [
              "Innovation platforms at BMW in Munich.",
              "Architected Diligent's enterprise design system.",
            ],
          },
          {
            period: "2020 — 2022",
            title: "Sky / NBCUniversal",
            org: "Senior Software Engineer",
            points: [
              "Peacock TV at multi-million-user scale.",
              "Performance, monitoring, and release safety.",
            ],
          },
          {
            period: "2022 — 2025",
            title: "Superglue → eino.ai",
            org: "Lead Frontend Engineer",
            points: [
              "Owned user-facing platform architecture.",
              "Agentic UX and digital-twin visualization.",
            ],
          },
          {
            period: "2025 — Present",
            title: "Moment → Fueled",
            org: "VP Engineering → Lead Engineer",
            points: [
              "Led an engineering org as VPE.",
              "Now leading enterprise web architecture at Fueled.",
            ],
          },
        ],
      },
    ],
  },
] as const;

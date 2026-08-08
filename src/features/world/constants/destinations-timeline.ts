import { getStationEntry } from "./station-index";
import type { Destination } from "../types";

export const timelineDestinations: readonly Destination[] = [
  {
    ...getStationEntry("timeline"),
    eyebrow: "The long arc",
    title: "From law school to leading AI-native platforms.",
    summary: "The chronological career and education timeline of Diogo Esteves.",
    blocks: [
      {
        kind: "lede",
        text: "Law school first, then the pivot. Every step since has traded up in scale, ambiguity, or altitude.",
      },
      {
        kind: "timeline",
        items: [
          {
            period: "2011 — 2014",
            title: "Law, first",
            org: "Universidade Lusófona · LLB",
            points: [
              "Argumentation, structure, and reading the fine print.",
              "Skills that still pay off in RFCs and contract negotiations.",
            ],
          },
          {
            period: "2015 — 2018",
            title: "The pivot",
            org: "ISEL · Computer Engineering",
            points: [
              "Software engineering, AI, and interactive systems.",
              "Shipping at Deloitte while finishing the degree.",
            ],
          },
          {
            period: "2016 — 2018",
            title: "Enterprise foundations",
            org: "Deloitte · Software Engineer",
            points: [
              "React/Redux frontends and data visualization for regulated clients.",
              "Learned to operate inside large, structured organizations.",
            ],
          },
          {
            period: "2018 — 2020",
            title: "First lead roles",
            org: "BMW Group → Diligent",
            points: [
              "Innovation platforms channeling R&D across the BMW Group.",
              "Architected Diligent's Fortune 1000 design system.",
            ],
          },
          {
            period: "2020 — 2022",
            title: "Streaming scale",
            org: "Sky · NBCUniversal",
            points: [
              "Peacock TV — tens of millions of subscribers.",
              "Performance, resilience, and release safety as product features.",
            ],
          },
          {
            period: "2022 — 2025",
            title: "The AI-native turn",
            org: "Superglue → eino.ai",
            points: [
              "Owned user-facing platforms end to end in seed-stage teams.",
              "Shipped agentic UX and digital-twin visualization to production.",
            ],
          },
          {
            period: "2025 — Present",
            title: "Altitude shifts",
            org: "Moment (VPE) → Fueled (Lead)",
            points: [
              "Built and led an engineering org as VP of Engineering.",
              "Now the senior frontend voice on enterprise engagements at Fueled.",
            ],
          },
        ],
      },
    ],
  },
] as const;

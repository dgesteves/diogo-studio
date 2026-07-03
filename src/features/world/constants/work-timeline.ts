export type WorkTimelineItem = {
  period: string;
  title: string;
  org: string;
  points: readonly string[];
};

export const workTimeline: readonly WorkTimelineItem[] = [
  {
    period: "Dec 2025 — Present",
    title: "Lead Engineer, Web Applications",
    org: "Fueled · Lisbon / Remote",
    points: [
      "Own the frontend craft on enterprise engagements at a 300+ person agency whose roster spans Google, Apple, the BBC, and the United Nations.",
      "Set technical direction on the standardized React + TypeScript stacks, design-system reuse, and AI-integrated product surfaces.",
      "Ship production AI-augmented surfaces: LLM-driven workflows, content intelligence, and internal tooling.",
    ],
  },
  {
    period: "Jun 2025 — Dec 2025",
    title: "VP of Engineering",
    org: "Moment · Lisbon / Remote",
    points: [
      "Owned technical vision, architecture, and the engineering org as an AI-first knowledge platform moved into production scale.",
      "Built teams across frontend, backend, AI/ML, and platform — hiring bar, leveling rubric, and team topology.",
      "Stood up the operating model: trunk-based CI/CD, observability, on-call, RFC process, and quality gates.",
    ],
  },
  {
    period: "Feb 2023 — Jun 2025",
    title: "Lead Frontend Engineer",
    org: "eino.ai · Remote",
    points: [
      "Led frontend architecture for an agentic wireless network-planning platform — digital twins for 5G, Wi-Fi, and private wireless.",
      "Built map-based twin visualization, real-time RF heatmaps, and agent orchestration panels in React, TypeScript, and GraphQL.",
      "Shipped agentic UX ahead of industry adoption: natural-language network design with inspectable agent reasoning.",
    ],
  },
  {
    period: "Mar 2022 — Feb 2023",
    title: "Lead Frontend Engineer",
    org: "Superglue · Remote",
    points: [
      "Owned the user-facing platform of a B2B partner-engagement SaaS used by teams at companies like Uberall.",
      "Built dashboards, recommendation flows, and integration UIs backed by automation and AI signals.",
    ],
  },
  {
    period: "Oct 2020 — Mar 2022",
    title: "Senior Software Engineer",
    org: "Sky · NBCUniversal / Comcast",
    points: [
      "Shipped React/Redux experiences on Peacock TV — tens of millions of subscribers across web and connected-TV clients.",
      "Hardened performance, resilience, and release safety where a regression reaches millions of viewers within minutes.",
    ],
  },
  {
    period: "Aug 2019 — Oct 2020",
    title: "Lead Frontend Engineer",
    org: "Diligent",
    points: [
      "Architected the company-wide design system behind GRC products used across a large share of the Fortune 1000.",
      "Published dual-framework React + Angular component libraries with theming, versioning, and a contribution model.",
    ],
  },
  {
    period: "Sep 2018 — Aug 2019",
    title: "Lead Frontend Engineer",
    org: "BMW Group",
    points: [
      "Led frontend for the Crowd and Open Innovation platforms sourcing strategic R&D ideas across the BMW Group.",
      "Held enterprise-grade security, scalability, and UX standards on Angular and .NET Core.",
    ],
  },
  {
    period: "Jan 2016 — Sep 2018",
    title: "Software Engineer",
    org: "Deloitte",
    points: [
      "Built React/Redux frontends and advanced data visualization for financial-services and regulated-industry clients.",
      "Set API-integration and maintainability patterns that other teams reused.",
    ],
  },
] as const;

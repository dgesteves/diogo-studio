/**
 * The career record, whole and authored once. Every representation derives from here:
 * the `/work` and `/timeline` timelines, the résumé and timeline screens painted on the
 * world's wall, `profile.alumniOf`, and the agent's retrieval index by way of the pages.
 *
 * Client-safe on purpose — no `server-only`. The 3D room is a client island and its
 * canvas screens read this directly, which is what keeps a fact out of a draw function.
 */

export type PatternId = "ai-native" | "design-systems" | "streaming" | "agentic-ux" | "enterprise";

export const patternLabels: Record<PatternId, string> = {
  "ai-native": "AI-native platforms",
  "design-systems": "Design-system infrastructure",
  streaming: "Streaming-grade reliability",
  "agentic-ux": "Agentic UX",
  enterprise: "Enterprise scale",
};

export type Engagement = {
  /** Stable across edits: it is the DOM anchor and half of a retrieval chunk's id. */
  id: string;
  /** The organization alone. Anything else — a city, a parent group — goes in `location`. */
  company: string;
  location?: string;
  role: string;
  /** Display form, e.g. "Dec 2025 — Present". */
  period: string;
  /** The short form the 600×800 canvas screens have room for, e.g. "2025 — NOW". */
  years: string;
  /** `YYYY-MM`, sortable as a string — what `/timeline` merges education against. */
  start: string;
  points: readonly string[];
  patterns: readonly PatternId[];
};

export const engagements: readonly Engagement[] = [
  {
    id: "fueled",
    company: "Fueled",
    location: "Lisbon / Remote",
    role: "Lead Engineer, Web Applications",
    period: "Dec 2025 — Present",
    years: "2025 — NOW",
    start: "2025-12",
    points: [
      "Own the frontend craft on enterprise engagements at a 300+ person agency whose roster spans Google, Apple, the BBC, and the United Nations.",
      "Set technical direction on the standardized React + TypeScript stacks, design-system reuse, and AI-integrated product surfaces.",
      "Ship production AI-augmented surfaces: LLM-driven workflows, content intelligence, and internal tooling.",
    ],
    patterns: ["ai-native", "design-systems", "enterprise"],
  },
  {
    id: "moment",
    company: "Moment",
    location: "Lisbon / Remote",
    role: "VP of Engineering",
    period: "Jun 2025 — Dec 2025",
    years: "2025",
    start: "2025-06",
    points: [
      "Owned technical vision, architecture, and the engineering org as an AI-first knowledge platform moved into production scale.",
      "Built teams across frontend, backend, AI/ML, and platform — hiring bar, leveling rubric, and team topology.",
      "Stood up the operating model: trunk-based CI/CD, observability, on-call, RFC process, and quality gates.",
    ],
    patterns: ["ai-native", "agentic-ux"],
  },
  {
    id: "eino",
    company: "eino.ai",
    location: "Remote",
    role: "Lead Frontend Engineer",
    period: "Feb 2023 — Jun 2025",
    years: "2023 — 25",
    start: "2023-02",
    points: [
      "Led frontend architecture for an agentic wireless network-planning platform — digital twins for 5G, Wi-Fi, and private wireless.",
      "Built map-based twin visualization, real-time RF heatmaps, and agent orchestration panels in React, TypeScript, and GraphQL.",
      "Shipped agentic UX ahead of industry adoption: natural-language network design with inspectable agent reasoning.",
    ],
    patterns: ["ai-native", "agentic-ux"],
  },
  {
    id: "superglue",
    company: "Superglue",
    location: "Remote",
    role: "Lead Frontend Engineer",
    period: "Mar 2022 — Feb 2023",
    years: "2022 — 23",
    start: "2022-03",
    points: [
      "Owned the user-facing platform of a B2B partner-engagement SaaS used by teams at companies like Uberall.",
      "Built dashboards, recommendation flows, and integration UIs backed by automation and AI signals.",
    ],
    patterns: ["ai-native", "enterprise"],
  },
  {
    id: "peacock",
    company: "Sky · NBCUniversal",
    location: "Comcast",
    role: "Senior Software Engineer",
    period: "Oct 2020 — Mar 2022",
    years: "2020 — 22",
    start: "2020-10",
    points: [
      "Shipped React/Redux experiences on Peacock TV — tens of millions of subscribers across web and connected-TV clients.",
      "Hardened performance, resilience, and release safety where a regression reaches millions of viewers within minutes.",
    ],
    patterns: ["streaming", "enterprise"],
  },
  {
    id: "diligent",
    company: "Diligent",
    role: "Lead Frontend Engineer",
    period: "Aug 2019 — Oct 2020",
    years: "2019 — 20",
    start: "2019-08",
    points: [
      "Architected the company-wide design system behind GRC products used across a large share of the Fortune 1000.",
      "Published dual-framework React + Angular component libraries with theming, versioning, and a contribution model.",
    ],
    patterns: ["design-systems", "enterprise"],
  },
  {
    id: "bmw",
    company: "BMW Group",
    role: "Lead Frontend Engineer",
    period: "Sep 2018 — Aug 2019",
    years: "2018 — 19",
    start: "2018-09",
    points: [
      "Led frontend for the Crowd and Open Innovation platforms sourcing strategic R&D ideas across the BMW Group.",
      "Held enterprise-grade security, scalability, and UX standards on Angular and .NET Core.",
    ],
    patterns: ["enterprise"],
  },
  {
    id: "deloitte",
    company: "Deloitte",
    role: "Software Engineer",
    period: "Jan 2016 — Sep 2018",
    years: "2016 — 18",
    start: "2016-01",
    points: [
      "Built React/Redux frontends and advanced data visualization for financial-services and regulated-industry clients.",
      "Set API-integration and maintainability patterns that other teams reused.",
    ],
    patterns: ["enterprise"],
  },
];

export type Education = {
  id: string;
  institution: string;
  qualification: string;
  period: string;
  /** `YYYY-MM`, sortable as a string — see `Engagement.start`. */
  start: string;
  points: readonly string[];
};

export const education: readonly Education[] = [
  {
    id: "isel",
    institution: "ISEL — Instituto Superior de Engenharia de Lisboa",
    qualification: "Computer Engineering",
    period: "2015 — 2018",
    start: "2015-09",
    points: [
      "Software engineering, AI, and interactive systems.",
      "Shipping at Deloitte while finishing the degree.",
    ],
  },
  {
    id: "lusofona",
    institution: "Universidade Lusófona",
    qualification: "LLB in Law",
    period: "2011 — 2014",
    start: "2011-09",
    points: [
      "Argumentation, structure, and reading the fine print.",
      "Skills that still pay off in RFCs and contract negotiations.",
    ],
  },
];

/** How an engagement reads as one line: "Fueled · Lisbon / Remote". */
export function orgLine(engagement: Engagement): string {
  return engagement.location
    ? `${engagement.company} · ${engagement.location}`
    : engagement.company;
}

/** Every organization the record names, newest first — the agent's identity chunk reads it. */
export const operatingCompanies: readonly string[] = engagements.map(
  (engagement) => engagement.company,
);

import type { CareerNode } from "./career-graph-node-types";

export type { CareerNode, NodeId } from "./career-graph-node-types";

export const nodes: readonly CareerNode[] = [
  {
    id: "fueled",
    label: "Fueled",
    fullName: "Fueled",
    role: "Lead Engineer, Web Applications",
    years: "2025+",
    summary:
      "Frontend architecture for enterprise web platforms across AI, media, and digital-transformation engagements.",
    patterns: ["ai-native", "design-systems", "enterprise"],
    position: [0.95, 0.5, 0.7],
    weight: 1,
  },
  {
    id: "moment",
    label: "Moment",
    fullName: "Moment",
    role: "VP of Engineering",
    years: "2025",
    summary:
      "Took an AI-native knowledge platform from prototype velocity to production reliability. Owned hiring, leveling, RFCs, on-call.",
    patterns: ["ai-native", "agentic-ux"],
    slug: "moment-ai-platform",
    position: [0.75, 0.95, 0.85],
    weight: 1.2,
  },
  {
    id: "eino",
    label: "eino.ai",
    fullName: "eino.ai",
    role: "Lead Frontend Engineer",
    years: "2023–2025",
    summary:
      "Agentic RF network planning, digital-twin maps, real-time heatmaps. Shipped agentic UX ahead of industry adoption.",
    patterns: ["ai-native", "agentic-ux"],
    slug: "eino-ai-network-planning",
    position: [0.4, 0.4, 0.95],
    weight: 1.2,
  },
  {
    id: "peacock",
    label: "Peacock",
    fullName: "Sky · NBCUniversal · Peacock",
    role: "Senior Software Engineer",
    years: "2020–2022",
    summary:
      "Tens-of-millions-of-viewers scale on streaming + commerce surfaces. Reliability, latency, release safety on the surfaces where regressions hit minutes after deploy.",
    patterns: ["streaming", "enterprise"],
    slug: "peacock-streaming",
    position: [-0.1, 0.2, -0.85],
    weight: 1.2,
  },
  {
    id: "diligent",
    label: "Diligent",
    fullName: "Diligent",
    role: "Lead Frontend Engineer",
    years: "2019–2020",
    summary:
      "Authored the company-wide React + Angular enterprise design system serving Fortune-1000-class governance products.",
    patterns: ["design-systems", "enterprise"],
    slug: "diligent-design-system",
    position: [-0.45, 0.7, 0.15],
    weight: 1.2,
  },
  {
    id: "bmw",
    label: "BMW Group",
    fullName: "BMW Group",
    role: "Lead Frontend Engineer",
    years: "2018–2019",
    summary:
      "Innovation platforms for the BMW Group — strategic R&D challenges across future mobility, sustainability, connected vehicles.",
    patterns: ["enterprise"],
    slug: "bmw-innovation",
    position: [-0.7, 0.45, -0.3],
    weight: 0.8,
  },
  {
    id: "deloitte",
    label: "Deloitte",
    fullName: "Deloitte",
    role: "Software Engineer",
    years: "2016–2018",
    summary:
      "Enterprise data-visualization surfaces for clients in financial services and regulated industries.",
    patterns: ["enterprise"],
    position: [-0.95, -0.1, -0.5],
    weight: 0.6,
  },
] as const;

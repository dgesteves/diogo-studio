import type { PatternId } from "@/constants/patterns";

export type EngagementId =
  "fueled" | "moment" | "eino" | "peacock" | "diligent" | "bmw" | "deloitte";

export type CareerEngagement = {
  id: EngagementId;
  name: string;
  role: string;
  years: string;
  summary: string;
  patterns: PatternId[];
};

export const careerEngagements: readonly CareerEngagement[] = [
  {
    id: "fueled",
    name: "Fueled",
    role: "Lead Engineer, Web Applications",
    years: "2025+",
    summary:
      "Frontend architecture for enterprise web platforms across AI, media, and digital-transformation engagements.",
    patterns: ["ai-native", "design-systems", "enterprise"],
  },
  {
    id: "moment",
    name: "Moment",
    role: "VP of Engineering",
    years: "2025",
    summary:
      "Took an AI-native knowledge platform from prototype velocity to production reliability. Owned hiring, leveling, RFCs, on-call.",
    patterns: ["ai-native", "agentic-ux"],
  },
  {
    id: "eino",
    name: "eino.ai",
    role: "Lead Frontend Engineer",
    years: "2023–2025",
    summary:
      "Agentic RF network planning, digital-twin maps, real-time heatmaps. Shipped agentic UX ahead of industry adoption.",
    patterns: ["ai-native", "agentic-ux"],
  },
  {
    id: "peacock",
    name: "Sky · NBCUniversal · Peacock",
    role: "Senior Software Engineer",
    years: "2020–2022",
    summary:
      "Tens-of-millions-of-viewers scale on streaming + commerce surfaces. Reliability, latency, release safety on the surfaces where regressions hit minutes after deploy.",
    patterns: ["streaming", "enterprise"],
  },
  {
    id: "diligent",
    name: "Diligent",
    role: "Lead Frontend Engineer",
    years: "2019–2020",
    summary:
      "Authored the company-wide React + Angular enterprise design system serving Fortune-1000-class governance products.",
    patterns: ["design-systems", "enterprise"],
  },
  {
    id: "bmw",
    name: "BMW Group",
    role: "Lead Frontend Engineer",
    years: "2018–2019",
    summary:
      "Innovation platforms for the BMW Group — strategic R&D challenges across future mobility, sustainability, connected vehicles.",
    patterns: ["enterprise"],
  },
  {
    id: "deloitte",
    name: "Deloitte",
    role: "Software Engineer",
    years: "2016–2018",
    summary:
      "Enterprise data-visualization surfaces for clients in financial services and regulated industries.",
    patterns: ["enterprise"],
  },
] as const;

export const operatingCompanies = [
  "Fueled",
  "Moment",
  "eino.ai",
  "Superglue",
  "Sky · NBCUniversal",
  "Diligent",
  "BMW Group",
  "Deloitte",
] as const;

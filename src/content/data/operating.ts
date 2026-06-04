export type OperatingAltitude = {
  tag: string;
  title: string;
  org: string;
  copy: string;
};

export const operatingAltitudes: readonly OperatingAltitude[] = [
  {
    tag: "01 — Staff IC",
    title: "Lead, frontend platform",
    org: "Fueled · current",
    copy: "Architecting AI-augmented web platforms for enterprise clients across media, technology, and digital-transformation programs.",
  },
  {
    tag: "02 — VP Engineering",
    title: "Built the operating model",
    org: "Moment · 2025",
    copy: "Took an AI-native platform from prototype velocity to production reliability. Hiring bar, leveling, RFCs, observability, on-call.",
  },
  {
    tag: "03 — Founding-engineer",
    title: "Shipped agentic UX in production",
    org: "eino.ai · 2023–2025",
    copy: "Owned the React + GraphQL foundation for agentic RF planning. Digital-twin maps, agent orchestration, proposal generation.",
  },
] as const;

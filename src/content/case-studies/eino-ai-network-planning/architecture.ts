import type { ArticleBlock } from "@/content/schema/article-blocks";

export const architecture: readonly ArticleBlock[] = [
  { kind: "heading", level: 2, text: "The product, in one paragraph" },
  {
    kind: "paragraph",
    text: 'Customers come in with a vague brief: *"connect these N rural clusters."* The agent reads the brief, drafts candidate radio sites on a real-world map, runs line-of-sight against terrain, proposes backhaul links, fits the radios, and hands the engineer a high-level network design they can edit. Editing anywhere in that chain re-triggers the affected agents — the plan is a graph, not a wizard.',
  },
  {
    kind: "paragraph",
    text: 'What makes it agentic, not "AI-flavored," is that every step is a discrete tool call the engineer can inspect, rerun, or override. The UI has to expose that without overwhelming the engineer with logs.',
  },
  { kind: "heading", level: 2, text: "Architecture" },
  {
    kind: "diagram",
    title: "eino.ai agentic planning surface",
    description:
      "React + GraphQL frontend orchestrates agent calls. Map + planning UI hold local state; agents stream proposals back; engineer accepts, edits, or reruns any leg.",
    caption: "Engineer drives the map; agents draft sites + links + capacity; every leg is auditable.",
    data: {
      nodes: [
        { id: "brief", label: "Brief intake", kind: "client", detail: "Prompt + uploads", x: 10, y: 18 },
        { id: "map", label: "Digital twin", kind: "client", detail: "MapLibre + terrain", x: 10, y: 72 },
        { id: "orch", label: "Plan orchestrator", kind: "service", detail: "GraphQL gateway", x: 50, y: 45 },
        { id: "siting", label: "Siting agent", kind: "agent", detail: "Candidate radio sites", x: 88, y: 12 },
        { id: "links", label: "Link agent", kind: "agent", detail: "PtP backhaul", x: 88, y: 45 },
        { id: "capacity", label: "Capacity agent", kind: "agent", detail: "Subscribers / Mbps", x: 88, y: 78 },
        { id: "tiles", label: "Geospatial store", kind: "data", detail: "Tiles + DEM", x: 50, y: 90 },
      ],
      edges: [
        { id: "e1", from: "brief", to: "orch", label: "intake" },
        { id: "e2", from: "map", to: "orch", label: "edits", variant: "dashed" },
        { id: "e3", from: "orch", to: "siting", label: "run" },
        { id: "e4", from: "orch", to: "links", label: "run" },
        { id: "e5", from: "orch", to: "capacity", label: "run" },
        { id: "e6", from: "siting", to: "map", label: "stream", variant: "dashed" },
        { id: "e7", from: "links", to: "map", label: "stream", variant: "dashed" },
        { id: "e8", from: "capacity", to: "map", label: "stream", variant: "dashed" },
        { id: "e9", from: "orch", to: "tiles", variant: "dotted" },
      ],
    },
  },
  {
    kind: "paragraph",
    text: "The orchestrator is a thin GraphQL gateway in front of the agents. The frontend treats every leg as a streamed mutation: the engineer triggers a leg, the leg streams partial proposals, and the map renders them as they arrive. The agents themselves are out of scope for this writeup — I owned the surface and the contract.",
  },
];

import "server-only";

import { getStationEntry, routes } from "../pages";
import type { Page } from "../schema";

export const projects: Page = {
  ...getStationEntry("projects"),
  eyebrow: "Highlighted work",
  title: "Platforms, design systems, and AI-native products.",
  summary: "Highlighted projects spanning AI platforms, design systems, and streaming media.",
  blocks: [
    {
      id: "projects",
      kind: "cards",
      items: [
        {
          title: "eino.ai — agentic network planning",
          meta: "AI · Digital twins",
          body: "Natural-language RF design for 5G, Wi-Fi, and private wireless. Digital-twin maps, live heatmaps, and agent reasoning you can inspect.",
        },
        {
          title: "Moment — knowledge intelligence",
          meta: "AI · Platform",
          body: "Ingestion, enrichment, retrieval, and automation with native agentic workflows and human-in-the-loop review.",
        },
        {
          title: "Peacock TV",
          meta: "Streaming · Scale",
          body: "React experiences for NBCUniversal's flagship streaming service — tens of millions of subscribers, strict latency and uptime budgets.",
        },
        {
          title: "Diligent design system",
          meta: "Design systems",
          body: "One system across React and Angular product lines, shipped as versioned NPM packages into Fortune 1000 boardrooms.",
        },
        {
          title: "BMW innovation platforms",
          meta: "Enterprise · Automotive",
          body: "Crowd and Open Innovation systems channeling swarm intelligence into BMW Group's future-mobility programs.",
        },
        {
          title: "This studio",
          meta: "R3F · Next.js",
          body: "The interactive 3D world you're standing in — React Three Fiber, App Router, and a command deck wired to every route.",
        },
      ],
    },
    {
      id: "next",
      kind: "links",
      items: [{ label: "Read the deeper dives", href: routes.caseStudies }],
    },
  ],
};

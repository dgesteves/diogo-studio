import { getStationEntry } from "@/content/pages";
import { routes } from "@/content/pages";
import type { Destination } from "../types";

export const projectDestinations: readonly Destination[] = [
  {
    ...getStationEntry("projects"),
    eyebrow: "Highlighted work",
    title: "Platforms, design systems, and AI-native products.",
    summary: "Highlighted projects spanning AI platforms, design systems, and streaming media.",
    blocks: [
      {
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
        kind: "links",
        items: [{ label: "Read the deeper dives", href: routes.caseStudies }],
      },
    ],
  },
  {
    ...getStationEntry("caseStudies"),
    eyebrow: "Deeper dives",
    title: "How the hard problems got solved.",
    summary: "In-depth case studies on design systems, streaming scale, and agentic UX.",
    blocks: [
      {
        kind: "cards",
        items: [
          {
            title: "One design system, two frameworks",
            meta: "Diligent",
            body: "Dual React + Angular component infrastructure that kept product teams consistent without freezing their roadmaps.",
          },
          {
            title: "Streaming-grade release safety",
            meta: "Peacock",
            body: "Instrumentation, monitoring, and CI gates for UIs where a regression hits millions of viewers within minutes.",
          },
          {
            title: "Agentic UX beyond the demo",
            meta: "eino.ai",
            body: "Natural-language design, autonomous execution with human override, and inspectable agent reasoning in production.",
          },
          {
            title: "Prototype velocity → production reliability",
            meta: "Moment",
            body: "Standing up hiring, RFCs, CI/CD, and observability as VPE — without breaking the shipping pace.",
          },
        ],
      },
      {
        kind: "lede",
        text: "Full write-ups are being drafted for this space. Until they land, I'll happily walk you through any of these live — architecture diagrams included.",
      },
      {
        kind: "links",
        items: [{ label: "Book a walkthrough", href: routes.contact }],
      },
    ],
  },
] as const;

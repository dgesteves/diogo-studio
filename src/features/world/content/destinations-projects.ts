import { routes } from "@/constants/routes";
import type { Destination } from "../types";

export const projectDestinations: readonly Destination[] = [
  {
    slug: "projects",
    href: routes.projects,
    label: "Projects",
    eyebrow: "Highlighted work",
    title: "Platforms, design systems, and AI-native products.",
    summary: "Highlighted projects spanning AI platforms, design systems, and streaming media.",
    blocks: [
      {
        kind: "cards",
        items: [
          {
            title: "eino.ai Network Planning",
            meta: "AI · Geospatial",
            body: "Agentic, cloud-native platform for wireless network planning with digital-twin visualizations.",
          },
          {
            title: "Moment AI Platform",
            meta: "AI · Knowledge",
            body: "AI-powered ingestion, retrieval, and automation for organizational knowledge intelligence.",
          },
          {
            title: "Diligent Design System",
            meta: "Design Systems",
            body: "Enterprise React + Angular component libraries with theming and versioning strategy.",
          },
          {
            title: "Peacock TV",
            meta: "Streaming",
            body: "React/Redux experiences for NBCUniversal's streaming service at multi-million-user scale.",
          },
          {
            title: "BMW Innovation Platforms",
            meta: "Automotive",
            body: "Crowd and open-innovation platforms supporting strategic R&D at BMW Group.",
          },
          {
            title: "AI-Augmented Enterprise Web",
            meta: "Fueled",
            body: "Production AI-powered enterprise platforms for ambitious clients.",
          },
        ],
      },
    ],
  },
  {
    slug: "caseStudies",
    href: routes.caseStudies,
    label: "Case studies",
    eyebrow: "Deeper dives",
    title: "How the hard problems got solved.",
    summary: "In-depth case studies on design systems, streaming scale, and agentic UX.",
    blocks: [
      {
        kind: "cards",
        items: [
          {
            title: "Surviving multiple product lines",
            meta: "Design system",
            body: "Contribution, theming, and versioning models that kept ten teams consistent and unblocked.",
          },
          {
            title: "Streaming-grade reliability",
            meta: "Performance",
            body: "Monitoring, release safety, and runtime optimization for multi-million-user streaming UIs.",
          },
          {
            title: "Agentic UX in production",
            meta: "AI-native",
            body: "Human-in-the-loop interfaces and prompt orchestration that held up beyond the demo.",
          },
        ],
      },
      {
        kind: "lede",
        text: "Full write-ups are in progress — reach out and I'll walk you through any of these in depth.",
      },
    ],
  },
] as const;

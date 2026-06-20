import { routes } from "@/constants/routes";
import type { Destination } from "../types";

export const explorationDestinations: readonly Destination[] = [
  {
    slug: "playground",
    href: routes.playground,
    label: "Playground",
    eyebrow: "Interactive toys",
    title: "Where the interface gets to play.",
    summary: "Interactive experiments powering this studio — 3D, motion, and command-driven UX.",
    blocks: [
      {
        kind: "cards",
        items: [
          {
            title: "This 3D world",
            meta: "R3F · Three.js",
            body: "A persistent, navigable studio rendered with React Three Fiber — the site you're in now.",
          },
          {
            title: "Career graph",
            meta: "SVG · Motion",
            body: "An animated graph connecting engagements by the patterns that link them.",
          },
          {
            title: "Command menu",
            meta: "cmdk · AI",
            body: "A ⌘K palette that navigates the world and answers questions about the work.",
          },
          {
            title: "Pixelated portrait",
            meta: "Canvas",
            body: "A portrait that resolves itself pixel by pixel on the about screen.",
          },
        ],
      },
    ],
  },
  {
    slug: "lab",
    href: routes.lab,
    label: "Lab",
    eyebrow: "R&D",
    title: "Half-finished ideas, in the open.",
    summary:
      "Research and development explorations by Diogo Esteves — AI tooling and interface R&D.",
    blocks: [
      {
        kind: "cards",
        items: [
          {
            title: "Agentic eval harnesses",
            meta: "AI",
            body: "Tooling to measure whether AI workflows actually hold up under real-world inputs.",
          },
          {
            title: "Streaming UI primitives",
            meta: "Performance",
            body: "Suspense-driven components for data-heavy, low-latency interfaces.",
          },
          {
            title: "Spatial navigation",
            meta: "3D",
            body: "Mapping information architecture onto a navigable 3D space — like this studio.",
          },
        ],
      },
      {
        kind: "lede",
        text: "Experiments here are rough on purpose. Some graduate to the playground.",
      },
    ],
  },
] as const;

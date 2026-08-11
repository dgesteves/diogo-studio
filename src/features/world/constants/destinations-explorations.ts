import { getStationEntry } from "./station-index";
import type { Destination } from "../types";

export const explorationDestinations: readonly Destination[] = [
  {
    ...getStationEntry("playground"),
    eyebrow: "Interactive toys",
    title: "Where the interface gets to play.",
    summary: "Interactive experiments powering this studio — 3D, motion, and command-driven UX.",
    blocks: [
      {
        kind: "lede",
        text: "Everything here is running live in the site you're standing in. No mockups — view source is the case study.",
      },
      {
        kind: "cards",
        items: [
          {
            title: "This 3D world",
            meta: "R3F · Three.js",
            body: "A persistent, navigable studio rendered with React Three Fiber — neon, volumetrics, and a boot sequence included.",
          },
          {
            title: "Procedural screens",
            meta: "Canvas · WebGL",
            body: "Every display in the room is a 2D canvas drawn at runtime and uploaded as a texture — no image assets, and the content stays live.",
          },
          {
            title: "Command deck",
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
    ...getStationEntry("lab"),
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
            body: "Tooling to measure whether agentic workflows hold up under real-world inputs — not just curated demos.",
          },
          {
            title: "Streaming UI primitives",
            meta: "Performance",
            body: "Suspense-driven components for data-heavy, low-latency interfaces, distilled from streaming-scale work.",
          },
          {
            title: "Spatial navigation",
            meta: "3D",
            body: "Mapping information architecture onto navigable 3D space — the research behind this studio.",
          },
        ],
      },
      {
        kind: "lede",
        text: "Experiments here are rough on purpose. The good ones graduate to the playground; the best ones ship for clients.",
      },
    ],
  },
] as const;

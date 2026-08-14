import { getStationEntry } from "../pages";
import type { Destination } from "../schema";

export const playground: Destination = {
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
};

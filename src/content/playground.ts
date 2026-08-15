/**
 * The interactive work, all of it running in this site. Client-safe — `/playground`
 * renders these as cards and the world's wall paints them; see `content/career.ts` for
 * why that requires one module outside `prose/`.
 *
 * The wall panel used to carry its own list — shader playgrounds, generative art, p5
 * sketches, audio-reactive visualizers — none of which exists. What is below does.
 */
export type Experiment = {
  id: string;
  title: string;
  meta: string;
  body: string;
};

export const experiments: readonly Experiment[] = [
  {
    id: "the-world",
    title: "This 3D world",
    meta: "R3F · Three.js",
    body: "A persistent, navigable studio rendered with React Three Fiber — neon, volumetrics, and a boot sequence included.",
  },
  {
    id: "procedural-screens",
    title: "Procedural screens",
    meta: "Canvas · WebGL",
    body: "Every display in the room is a 2D canvas drawn at runtime and uploaded as a texture — no image assets, and the content stays live.",
  },
  {
    id: "command-deck",
    title: "Command deck",
    meta: "cmdk · AI",
    body: "A ⌘K palette that navigates the world and answers questions about the work.",
  },
  {
    id: "pixelated-portrait",
    title: "Pixelated portrait",
    meta: "Canvas",
    body: "A portrait that resolves itself pixel by pixel on the about screen.",
  },
];

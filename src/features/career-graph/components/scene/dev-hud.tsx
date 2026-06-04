"use client";

import { Stats } from "@react-three/drei";

import { env } from "@/env";

/**
 * Dev-only inspector tooling, gated behind `NODE_ENV !== "production"`.
 *
 * Uses drei's `<Stats>` (a thin wrapper around stats.js) for an FPS / ms
 * readout. We deliberately avoid `r3f-perf` here: it ships its bitmap font
 * as a base64 `.mjs` payload that Turbopack can't parse as UTF-8 source
 * (Next 16 default bundler), which breaks the dev build outright.
 *
 * The richer perf surface (draw calls, GPU memory, web-vitals, bundle-size
 * readout) is owned by Phase 5's Inspector Overlay (`S4` in the blueprint),
 * not by the canvas itself. Keeping this minimal also means zero impact on
 * the production bundle — `process.env.NODE_ENV` is dead-code-eliminated.
 */

const isDev = process.env.NODE_ENV !== "production";

// Opt-in via env so the dev FPS panel doesn't clutter the visual review.
// Set `NEXT_PUBLIC_PERF_HUD=1` (in `.env.local`) to enable.
const enabled = isDev && env.NEXT_PUBLIC_PERF_HUD === "1";

export function CareerGraphDevHud() {
  if (!enabled) return null;
  // drei <Stats> mounts a fixed-position panel via a portal; safe outside Canvas.
  return <Stats showPanel={0} />;
}

"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Preload } from "@react-three/drei";
import { CameraDolly } from "./scene/camera-dolly";
import { CareerGraphDevHud } from "./scene/dev-hud";
import { HeatmapField } from "./scene/heatmap-field";
import { CareerParticles } from "./scene/particles";
import { Postprocessing } from "./scene/postprocessing";

/**
 * R3F Canvas for the Career Graph hero — atmospheric layer only.
 *
 * The SVG Career Graph above this canvas owns all data, labels, edges,
 * clicks, focus, and the screen-reader story. The canvas's sole job is to
 * add depth and "live telemetry" atmosphere behind it:
 *
 * - **Heatmap shader** — drifting cloud field nodded to RF heatmaps.
 * - **Particle field** — slow cyan flecks for parallax depth.
 * - **Scroll-driven camera dolly** — subtle parallax on scroll, Lenis-smoothed.
 * - **Restrained postprocessing** — bloom on the particles' emissive only,
 *   plus a soft vignette.
 *
 * Mount conditions are evaluated by the parent wrapper (`career-graph.tsx`):
 * - never mounted when `prefers-reduced-motion: reduce`
 * - never mounted when low-power signals are present
 * - mounted only after first hydration so the SVG drives LCP
 *
 * Pointer events on the canvas are disabled by the wrapper so clicks pass
 * through to the SVG layer above.
 */
export function CareerGraphCanvas({
  containerRef,
  onReady,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  onReady?: () => void;
}) {
  return (
    <Canvas
      // `dpr` capped at 1.75 — full Retina (2+) doubles GPU cost for ~0
      // perceptual gain on this scene.
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      style={{ background: "transparent" }}
      onCreated={() => onReady?.()}
    >
      <PerspectiveCamera makeDefault fov={42} position={[0, 0, 4]} near={0.1} far={20} />

      {/* No physical lighting — the scene is shader-driven (heatmap) and
          emissive particles. Skipping lights saves GPU work for the dolly. */}

      <Suspense fallback={null}>
        <HeatmapField intensity={1} />
        <CareerParticles />
      </Suspense>

      <CameraDolly containerRef={containerRef} />
      <Postprocessing />

      <CareerGraphDevHud />
      <Preload all />
    </Canvas>
  );
}

export default CareerGraphCanvas;

"use client";

import { Suspense, type ReactElement } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, PerspectiveCamera, Preload } from "@react-three/drei";
import { CameraDolly } from "./scene/camera-dolly";
import { CareerGraphDevHud } from "./scene/dev-hud";
import { GridFloor } from "./scene/grid-floor";
import { HeatmapField } from "./scene/heatmap-field";
import { CareerParticles } from "./scene/particles";
import { PerfReporter } from "@/components/r3f/perf-reporter";
import { Postprocessing } from "./scene/postprocessing";
import { RadarSweep } from "./scene/radar-sweep";
import { WebGLContextGuard } from "@/components/r3f/webgl-context-guard";

/**
 * R3F Canvas for the Career Graph hero — atmospheric layer.
 *
 * The SVG Career Graph above this canvas owns all data, labels, edges,
 * clicks, focus, and the screen-reader story. The canvas's job is to add
 * depth and "live telemetry" atmosphere behind it:
 *
 * - **Volumetric heatmap** — raymarched 3D FBM noise with a pulsing scan
 *   ping. Reacts to mouse position for parallax.
 * - **Radar sweep** — slow rotating cyan arc with a decaying trail.
 * - **Perspective grid floor** — wireframe plane receding into depth.
 * - **Particle field** — slow cyan flecks for foreground parallax.
 * - **Camera dolly** — scroll + mouse parallax + idle orbit, all damped.
 * - **Postprocessing** — bloom + subtle CA + film grain + vignette.
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
}): ReactElement {
  return (
    <Canvas
      // DPR cap: at full-bleed hero width, anything above ~1.25 measurably
      // jittered on integrated GPUs. AdaptiveDpr below will further drop
      // toward 1.0 whenever frame time spikes, then restore at idle.
      dpr={[1, 1.25]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      // Frameloop=demand keeps the rAF loop awake but lets R3F skip frames
      // whenever no `useFrame` callback requests one. Our useFrame hooks
      // run continuously (animated shaders), so this is effectively
      // "always" in practice — the difference is that hidden tabs cleanly
      // stop pumping.
      frameloop="always"
      style={{ background: "transparent" }}
      onCreated={() => onReady?.()}
    >
      <WebGLContextGuard />
      <PerfReporter />

      <PerspectiveCamera makeDefault fov={42} position={[0, 0, 4]} near={0.1} far={30} />

      {/* No physical lighting — the scene is shader-driven (heatmap, radar,
          grid) plus emissive particles. Skipping lights frees the rAF
          budget for the dolly and the postprocessing chain. */}

      <Suspense fallback={null}>
        {/* Background → foreground render order via `renderOrder` on each.
            Intensities tuned with the atmosphere now spanning the full
            hero width — at this scale the heatmap and grid would read as
            too dominant at their previous values. */}
        <HeatmapField intensity={0.75} />
        <RadarSweep intensity={0.65} />
        <GridFloor intensity={0.7} />
        <CareerParticles />
      </Suspense>

      <CameraDolly containerRef={containerRef} />
      <Postprocessing />

      {/* AdaptiveDpr lowers the renderer's pixel ratio toward 0.5 when
          frame time spikes, then restores it back toward the cap at
          steady state. AdaptiveEvents drops pointer-event polling rate
          during the same spikes. Together they keep the scene fluid
          when the GPU briefly falls behind. */}
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />

      <CareerGraphDevHud />
      <Preload all />
    </Canvas>
  );
}

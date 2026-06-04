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

export function CareerGraphCanvas({
  containerRef,
  onReady,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  onReady?: () => void;
}): ReactElement {
  return (
    <Canvas
      dpr={[1, 1.25]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      frameloop="always"
      style={{ background: "transparent" }}
      onCreated={() => onReady?.()}
    >
      <WebGLContextGuard />
      <PerfReporter />

      <PerspectiveCamera makeDefault fov={42} position={[0, 0, 4]} near={0.1} far={30} />

      <Suspense fallback={null}>
        <HeatmapField intensity={0.75} />
        <RadarSweep intensity={0.65} />
        <GridFloor intensity={0.7} />
        <CareerParticles />
      </Suspense>

      <CameraDolly containerRef={containerRef} />
      <Postprocessing />

      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />

      <CareerGraphDevHud />
      <Preload all />
    </Canvas>
  );
}

"use client";

import "@/components/r3f/silence-clock-deprecation";

import { type ReactElement } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, PerspectiveCamera, Preload } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

import { PerfReporter } from "@/components/r3f/perf-reporter";
import { WebGLContextGuard } from "@/components/r3f/webgl-context-guard";
import { StudioScene } from "@/features/studio";
import type { RouteKey } from "@/constants/routes";

import { getStation } from "../constants/stations";
import { Lounge } from "./lounge/lounge";
import { WorldCamera } from "./world-camera";
import { WorldNeon } from "./world-neon";
import { WorldPortals } from "./world-portals";
import { WorldProps } from "./world-props";

type WorldCanvasProps = {
  active: RouteKey;
  onReady?: () => void;
};

export function WorldCanvas({ active, onReady }: WorldCanvasProps): ReactElement {
  const home = getStation("home");

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={["#05080b"]} />
      <fog attach="fog" args={["#05080b", 9, 30]} />

      <WebGLContextGuard />
      <PerfReporter />

      <PerspectiveCamera makeDefault fov={44} near={0.1} far={60} position={home.position} />
      <WorldCamera active={active} />

      <StudioScene />
      <WorldProps />
      <Lounge />
      <WorldNeon />
      <WorldPortals active={active} />

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.45} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.3} darkness={0.6} eskil={false} />
      </EffectComposer>

      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <Preload all />
    </Canvas>
  );
}

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
import { useWorldPalette } from "@/hooks/use-world-palette";

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
  const palette = useWorldPalette();

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.fogColor, palette.fogNear, palette.fogFar]} />

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
        <Bloom
          intensity={palette.bloomIntensity}
          luminanceThreshold={palette.bloomLuminanceThreshold}
          luminanceSmoothing={palette.bloomLuminanceSmoothing}
          mipmapBlur
        />
        <Vignette
          offset={palette.vignetteOffset}
          darkness={palette.vignetteDarkness}
          eskil={false}
        />
      </EffectComposer>

      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <Preload all />
    </Canvas>
  );
}

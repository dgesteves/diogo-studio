"use client";

import "@/components/r3f/silence-clock-deprecation";

import { type ReactElement } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, PerspectiveCamera, Preload } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";

import { PerfReporter } from "@/components/r3f/perf-reporter";
import { WebGLContextGuard } from "@/components/r3f/webgl-context-guard";
import { StudioScene } from "@/features/studio";
import type { RouteKey } from "@/constants/routes";
import { useWorldPalette } from "@/hooks/use-world-palette";
import { markWorldReady } from "@/stores/boot-store";

import { getDestination } from "../constants/destinations";
import { getStation } from "../constants/stations";
import { useExplore } from "../hooks/use-explore";
import { useExploreHandoff } from "../hooks/use-explore-handoff";
import { useExploreInput } from "../hooks/use-explore-input";
import { useOrbitInput } from "../hooks/use-orbit-input";
import { BootProgressReporter } from "./boot-progress-reporter";
import { ExploreController } from "./explore-controller";
import { Lounge } from "./lounge/lounge";
import { WorldCamera } from "./world-camera";
import { WorldInteract } from "./world-interact";
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
  const router = useRouter();
  const explore = useExplore();
  const orbitEnabled = active === "home" && !explore;
  const orbitInput = useOrbitInput(orbitEnabled);
  const exploreInput = useExploreInput(explore);
  useExploreHandoff(active, explore);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={() => {
        markWorldReady();
        onReady?.();
      }}
    >
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.fogColor, palette.fogNear, palette.fogFar]} />

      <WebGLContextGuard />
      <PerfReporter />
      <BootProgressReporter />

      <PerspectiveCamera makeDefault fov={44} near={0.1} far={60} position={home.position} />
      <WorldCamera active={active} input={orbitInput} />
      {explore ? (
        <ExploreController input={exploreInput} />
      ) : (
        <WorldInteract
          input={orbitInput}
          onSelect={(slug) => router.push(getDestination(slug).href)}
        />
      )}

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

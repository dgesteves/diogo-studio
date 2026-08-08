"use client";

import "@/components/r3f/silence-clock-deprecation";

import { useCallback, useState, type ReactElement } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveEvents, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { useRouter } from "next/navigation";

import { PerfReporter } from "@/components/r3f/perf-reporter";
import { ScenePrecompile } from "@/components/r3f/scene-precompile";
import { WebGLContextGuard } from "@/components/r3f/webgl-context-guard";
import { useCommandMenu } from "@/features/command-menu";
import { StudioScene } from "@/features/studio";
import type { RouteKey } from "@/constants/routes";
import { useWorldPalette } from "@/hooks/use-world-palette";
import { markWorldReady } from "@/stores/boot-store";

import { getStationEntry } from "../constants/station-index";
import { DPR_MIN, dprForFactor } from "../constants/render";
import { getStation } from "../constants/stations";
import { useExplore } from "../hooks/use-explore";
import { useExploreHandoff } from "../hooks/use-explore-handoff";
import { useExploreInput } from "../hooks/use-explore-input";
import { useOrbitInput } from "../hooks/use-orbit-input";
import { AiCore } from "./ai-core";
import { BootProgressReporter } from "./boot-progress-reporter";
import { ExploreController } from "./explore-controller";
import { Lounge } from "./lounge/lounge";
import { WorldCamera } from "./world-camera";
import { WorldInteract } from "./world-interact";
import { WorldNeon } from "./world-neon";
import { WorldPortals } from "./world-portals";
import { WorldPostprocessing } from "./world-postprocessing";
import { WorldProps } from "./world-props";

type WorldCanvasProps = {
  active: RouteKey;
  onReady?: () => void;
};

export function WorldCanvas({ active, onReady }: WorldCanvasProps): ReactElement {
  const home = getStation("home");
  const palette = useWorldPalette();
  const router = useRouter();
  const { openWithMode } = useCommandMenu();
  const explore = useExplore();
  const orbitEnabled = active === "home" && !explore;
  const orbitInput = useOrbitInput(orbitEnabled);
  const exploreInput = useExploreInput(explore);
  useExploreHandoff(active, explore);
  const [dpr, setDpr] = useState(DPR_MIN);

  const handleCompiled = useCallback(() => {
    markWorldReady();
    onReady?.();
  }, [onReady]);

  return (
    <Canvas dpr={dpr} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
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
          onSelect={(slug) => router.push(getStationEntry(slug).href)}
          onAskAi={() => openWithMode("ask")}
        />
      )}

      <StudioScene />
      <WorldProps />
      <Lounge />
      <WorldNeon />
      <WorldPortals active={active} />
      <AiCore />

      <WorldPostprocessing />

      <PerformanceMonitor
        onChange={({ factor }) => setDpr(dprForFactor(factor))}
        flipflops={3}
        onFallback={() => setDpr(DPR_MIN)}
      />
      <AdaptiveEvents />
      <ScenePrecompile onCompiled={handleCompiled} />
    </Canvas>
  );
}

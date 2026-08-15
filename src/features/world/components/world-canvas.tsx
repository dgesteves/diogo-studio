"use client";

import "@/components/r3f/silence-clock-deprecation";

import { useCallback, useState, type ReactElement } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveEvents, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { useRouter } from "next/navigation";

import { PerfReporter } from "@/components/r3f/perf-reporter";
import { ScenePrecompile } from "@/components/r3f/scene-precompile";
import { useCommandMenu } from "@/features/command-menu";
import { StudioScene } from "@/world/scene/studio";
import type { RouteKey } from "@/content/pages";
import { useWorldPalette } from "@/world/materials";
import { markWorldReady } from "@/world/boot";

import { getStationEntry } from "@/content/pages";
import { DPR_DEGRADED, DPR_MIN, dprForFactor } from "../constants/render";
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
import { WorldQualityGuard } from "./world-quality-guard";
import type { WorldQuality } from "../utils/frame-budget";

type WorldCanvasProps = {
  active: RouteKey;
  quality: WorldQuality;
  onQuality: (quality: WorldQuality) => void;
  onReady?: () => void;
};

export function WorldCanvas({
  active,
  quality,
  onQuality,
  onReady,
}: WorldCanvasProps): ReactElement {
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
  const full = quality === "full";

  const handleCompiled = useCallback(() => {
    markWorldReady();
    onReady?.();
  }, [onReady]);

  return (
    <Canvas
      // `demand` renders once and then only when something invalidates, so a renderer
      // that cannot hold a frame rate still paints the scene — it just stops paying for
      // it every frame. The world is decorative; a still image of it is the honest
      // trade, and it is what `WorldFallback` already shows under reduced motion.
      frameloop={quality === "frozen" ? "demand" : "always"}
      dpr={full ? dpr : DPR_DEGRADED}
      gl={{ antialias: full, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[palette.background]} />
      <fog attach="fog" args={[palette.fogColor, palette.fogNear, palette.fogFar]} />

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

      {full ? <WorldPostprocessing /> : null}

      {full ? (
        <PerformanceMonitor
          onChange={({ factor }) => setDpr(dprForFactor(factor))}
          flipflops={3}
          onFallback={() => setDpr(DPR_MIN)}
        />
      ) : null}
      <WorldQualityGuard quality={quality} onDegrade={onQuality} />
      <AdaptiveEvents />
      <ScenePrecompile onCompiled={handleCompiled} />
    </Canvas>
  );
}

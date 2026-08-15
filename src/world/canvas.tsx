"use client";

import { useFrame, useThree, Canvas } from "@react-three/fiber";
import { useEffect, useRef, useCallback, useState, type ReactElement } from "react";
import { markPerfInactive, publishPerf } from "./perf";
import "./silence-clock-deprecation";
import { AdaptiveEvents, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { useCommandMenu } from "@/features/command-menu";
import { StudioScene } from "./scene/studio";
import { type RouteKey, getStationEntry } from "@/content/pages";
import { useWorldPalette } from "./materials";
import {
  DPR_DEGRADED,
  DPR_MIN,
  dprForFactor,
  WorldQualityGuard,
  type WorldQuality,
} from "./quality";
import { getStation } from "./stations";
import { useExplore, useExploreHandoff, ExploreController } from "./explore";
import { useExploreInput, useOrbitInput } from "./input";
import { AiCore } from "./scene/ai-core";
import { BootProgressReporter } from "./boot";
import { markWorldReady } from "./store";
import { Lounge } from "./scene/lounge";
import { WorldCamera } from "./camera";
import { WorldInteract } from "./interact";
import { WorldNeon } from "./scene/neon";
import { WorldPortals } from "./hotspots";
import { WorldPostprocessing } from "./postprocessing";
import { WorldProps } from "./scene/props";

/**
 * The composition root inside the `<Canvas>`: what the renderer is allowed to cost, which
 * layers exist, and the two instruments that draw nothing — one publishes frame stats to
 * `perf.ts`, the other tells the boot screen the shaders are warm.
 */

export function PerfReporter(): null {
  const gl = useThree((state) => state.gl);
  const frames = useRef(0);
  const windowStart = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (windowStart.current === 0) windowStart.current = now;
    frames.current += 1;

    const elapsed = now - windowStart.current;
    if (elapsed >= 250) {
      const fps = (frames.current * 1000) / elapsed;
      const info = gl.info;
      publishPerf({
        fps: Math.round(fps),
        frameMs: Math.round((elapsed / frames.current) * 10) / 10,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length ?? 0,
      });
      frames.current = 0;
      windowStart.current = now;
    }
  });

  useEffect(() => {
    return () => markPerfInactive();
  }, []);

  return null;
}

/** Never let a stalled driver keep the scene hidden behind the boot screen. */
const COMPILE_TIMEOUT_MS = 8000;

/**
 * Warms up every material in the scene without blocking the main thread.
 *
 * `compileAsync` drives the `KHR_parallel_shader_compile` extension, so shader
 * linking happens on driver threads and readiness is polled instead of stalling
 * on `getProgramParameter`. drei's `<Preload all />` is deliberately avoided: it
 * calls the synchronous `gl.compile()` and then renders the whole scene six more
 * times through a `CubeCamera` inside a layout effect, only to throw it away.
 */
export function ScenePrecompile({ onCompiled }: { onCompiled: () => void }): null {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    let settled = false;
    const settle = (): void => {
      if (settled) return;
      settled = true;
      onCompiled();
    };

    const timer = window.setTimeout(settle, COMPILE_TIMEOUT_MS);
    void gl.compileAsync(scene, camera).then(settle, settle);

    return () => {
      settled = true;
      window.clearTimeout(timer);
    };
  }, [gl, scene, camera, onCompiled]);

  return null;
}

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

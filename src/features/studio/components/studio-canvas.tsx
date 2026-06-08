"use client";

import "@/components/r3f/silence-clock-deprecation";

import { Suspense, type ReactElement } from "react";
import { Canvas } from "@react-three/fiber";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  ContactShadows,
  OrthographicCamera,
  Preload,
} from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

import { PerfReporter } from "@/components/r3f/perf-reporter";
import { WebGLContextGuard } from "@/components/r3f/webgl-context-guard";

import { CameraIdle } from "./scene/camera-idle";
import { Chair } from "./scene/chair";
import { Desk } from "./scene/desk";
import { DeskExtras } from "./scene/desk-extras";
import { DeskProps } from "./scene/desk-props";
import { DustMotes } from "./scene/dust-motes";
import { GridFloor } from "./scene/grid-floor";
import { Lighting } from "./scene/lighting";
import { MonitorRig } from "./scene/monitor-rig";
import { Room } from "./scene/room";
import { Speakers } from "./scene/speakers";

export function StudioCanvas({
  containerRef,
  onReady,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
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
      style={{ background: "transparent" }}
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={["#070b0e"]} />
      <fog attach="fog" args={["#070b0e", 10, 24]} />

      <WebGLContextGuard />
      <PerfReporter />

      <OrthographicCamera makeDefault position={[3.3, 2.6, 4.0]} zoom={180} near={0.1} far={50} />

      <Lighting />
      <CameraIdle containerRef={containerRef} />

      <Suspense fallback={null}>
        <Room />
        <GridFloor />
        <Desk />
        <Chair />
        <DeskProps />
        <DeskExtras />
        <Speakers />
        <MonitorRig />
      </Suspense>

      <ContactShadows
        position={[0, 0.015, 0]}
        scale={9}
        resolution={512}
        blur={2.8}
        far={3}
        opacity={0.5}
        color="#02060a"
        frames={1}
      />
      <DustMotes />

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom intensity={0.65} luminanceThreshold={0.5} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette offset={0.32} darkness={0.55} eskil={false} />
      </EffectComposer>

      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <Preload all />
    </Canvas>
  );
}

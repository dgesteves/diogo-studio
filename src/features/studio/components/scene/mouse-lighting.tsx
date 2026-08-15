"use client";

import { type ReactElement } from "react";
import { DoubleSide } from "three";
import { worldColors } from "@/world/materials";
import { useDisposable } from "@/hooks/use-disposable";

import { createMouseBandGeometry, type MouseBand } from "./mouse-trim-geometry";

const SKIRT: MouseBand = { offset: 0.00015, bottom: 0, top: 0.0038 };
const LED: MouseBand = { offset: 0.00055, bottom: 0.0013, top: 0.0027 };
const HALO: MouseBand = { offset: 0.0013, bottom: 0.0005, top: 0.0036 };

export function MouseGlow(): ReactElement {
  const bands = useDisposable(() => ({
    skirt: createMouseBandGeometry(SKIRT),
    led: createMouseBandGeometry(LED),
    halo: createMouseBandGeometry(HALO),
  }));

  return (
    <>
      <mesh geometry={bands.skirt}>
        <meshStandardMaterial color="#070c11" roughness={0.72} metalness={0.35} side={DoubleSide} />
      </mesh>
      <mesh geometry={bands.led}>
        <meshBasicMaterial color={worldColors.accentBright} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh geometry={bands.halo}>
        <meshBasicMaterial
          color={worldColors.accent}
          toneMapped={false}
          side={DoubleSide}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        position={[0, 0.006, -0.03]}
        intensity={0.05}
        distance={0.14}
        decay={2}
        color={worldColors.accent}
      />
      <pointLight
        position={[0, 0.006, 0.03]}
        intensity={0.07}
        distance={0.16}
        decay={2}
        color={worldColors.accent}
      />
    </>
  );
}

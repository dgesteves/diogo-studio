"use client";

import { type ReactElement } from "react";
import { AdditiveBlending } from "three";
import { createRadialGlowTexture } from "../lib/radial-glow";

type HotspotGlowProps = {
  position: [number, number, number];
  rotation: [number, number, number];
  size: number;
  accent: string;
};

export function HotspotGlow({ position, rotation, size, accent }: HotspotGlowProps): ReactElement {
  const texture = createRadialGlowTexture();
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture}
        color={accent}
        transparent
        opacity={0.6}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

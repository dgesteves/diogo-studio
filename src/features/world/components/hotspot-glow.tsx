"use client";

import { type ReactElement, type Ref } from "react";
import { AdditiveBlending, type Mesh } from "three";
import { createRadialGlowTexture } from "../utils/radial-glow";

type HotspotGlowProps = {
  position: [number, number, number];
  rotation: [number, number, number];
  size: number;
  accent: string;
  ref?: Ref<Mesh>;
};

export function HotspotGlow({
  position,
  rotation,
  size,
  accent,
  ref,
}: HotspotGlowProps): ReactElement {
  const texture = createRadialGlowTexture();
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
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

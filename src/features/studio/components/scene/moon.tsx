"use client";

import { type ReactElement } from "react";
import { AdditiveBlending } from "three";
import { useDisposable } from "@/hooks/use-disposable";

import { createGlowTexture, createMoonTexture } from "./moon-textures";

const MOON_POSITION: [number, number, number] = [1.1, 1.05, -0.8];
const STAR_POSITION: [number, number, number] = [6.5, 0.6, -7.5];
const MOON_COLOR = "#eef4f8";

export function Moon(): ReactElement {
  // three.js textures need a stable identity to avoid re-uploading to the GPU
  const glow = useDisposable(() => createGlowTexture());
  const surface = useDisposable(() => createMoonTexture());

  return (
    <group>
      <group position={MOON_POSITION}>
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial
            map={glow}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.3, 48, 48]} />
          <meshBasicMaterial map={surface} toneMapped={false} fog={false} />
        </mesh>
      </group>

      <mesh position={STAR_POSITION}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={MOON_COLOR} toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

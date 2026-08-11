"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the texture the hook holds is intentionally mutated here.
 */

import { useEffect, type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import type { CanvasTexture } from "three";
import { useDisposable } from "@/hooks/use-disposable";
import { createCanvasTexture } from "@/features/studio/components/screens/canvas-texture";

export type ScreenDraw = (ctx: CanvasRenderingContext2D) => void;

type WallScreenProps = {
  draw: ScreenDraw;
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
};

function useScreenTexture(draw: ScreenDraw): CanvasTexture {
  const { canvas, texture } = useDisposable(() => createCanvasTexture(600, 800));
  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    draw(ctx);
    texture.needsUpdate = true;
  }, [canvas, texture, draw]);
  return texture;
}

export function WallScreen({
  draw,
  position,
  rotationY = 0,
  width = 0.6,
  height = 0.66,
}: WallScreenProps): ReactElement {
  const texture = useScreenTexture(draw);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[width + 0.06, height + 0.06, 0.05]} radius={0.014} smoothness={3}>
        <meshStandardMaterial color="#0a0f13" roughness={0.4} metalness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

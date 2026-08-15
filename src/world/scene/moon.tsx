"use client";

import { type ReactElement } from "react";
import { type CanvasTexture, AdditiveBlending } from "three";
import { useDisposable } from "@/hooks/use-disposable";
import { mulberry32 } from "@/utils/mulberry32";
import { createCanvasTexture } from "../screens/texture";

/**
 * The moon and its glow, both painted onto canvas textures rather than modelled. Two textures
 * for one object: the disc reads as geometry and the halo has to blend additively over the
 * sky, which one material cannot do.
 */

export function createGlowTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(128, 128);
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(238,244,248,0.55)");
  gradient.addColorStop(0.28, "rgba(180,222,240,0.26)");
  gradient.addColorStop(0.6, "rgba(159,216,236,0.07)");
  gradient.addColorStop(1, "rgba(159,216,236,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  texture.needsUpdate = true;
  return texture;
}

export function createMoonTexture(): CanvasTexture {
  const size = 128;
  const { canvas, texture } = createCanvasTexture(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  ctx.fillStyle = "#dbe6ec";
  ctx.fillRect(0, 0, size, size);

  const rand = mulberry32(42);
  for (let i = 0; i < 8; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 10 + rand() * 26;
    const maria = ctx.createRadialGradient(x, y, 0, x, y, r);
    maria.addColorStop(0, "rgba(166,182,194,0.5)");
    maria.addColorStop(1, "rgba(166,182,194,0)");
    ctx.fillStyle = maria;
    ctx.fillRect(0, 0, size, size);
  }

  for (let i = 0; i < 24; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 2.4;
    ctx.fillStyle = "rgba(146,162,176,0.4)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  texture.needsUpdate = true;
  return texture;
}

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

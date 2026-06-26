import type { CanvasTexture } from "three";

import { createCanvasTexture } from "@/features/studio/components/screens/canvas-texture";
import { mulberry32 } from "./city-textures";

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

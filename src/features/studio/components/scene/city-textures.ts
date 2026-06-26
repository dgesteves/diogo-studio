import type { CanvasTexture } from "three";
import { createCanvasTexture } from "@/features/studio/components/screens/canvas-texture";

const LIT_WINDOW_COLORS = ["#22d3ee", "#67e8f9", "#7dd3fc", "#fbbf24", "#f6efe1"] as const;
const FACADE_BASE = "#070b10";
const FACADE_WIDTH = 128;
const FACADE_HEIGHT = 256;

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCityFacadeTexture(seed: number): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(FACADE_WIDTH, FACADE_HEIGHT);
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const rand = mulberry32(seed);
  ctx.fillStyle = FACADE_BASE;
  ctx.fillRect(0, 0, FACADE_WIDTH, FACADE_HEIGHT);

  const cols = 5;
  const rows = 18;
  const padding = 8;
  const cellW = (FACADE_WIDTH - padding * 2) / cols;
  const cellH = (FACADE_HEIGHT - padding * 2) / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (rand() < 0.28) continue;
      const color = LIT_WINDOW_COLORS[Math.floor(rand() * LIT_WINDOW_COLORS.length)] ?? "#22d3ee";
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.55 + rand() * 0.45;
      const x = padding + col * cellW + cellW * 0.16;
      const y = padding + row * cellH + cellH * 0.16;
      ctx.fillRect(x, y, cellW * 0.68, cellH * 0.52);
    }
  }

  ctx.globalAlpha = 1;
  texture.needsUpdate = true;
  return texture;
}

export function createSkyTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(64, 256);
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#02040a");
  gradient.addColorStop(0.3, "#081521");
  gradient.addColorStop(0.42, "#16415a");
  gradient.addColorStop(0.49, "#3a92ad");
  gradient.addColorStop(0.56, "#1a4a5e");
  gradient.addColorStop(0.74, "#0a1c28");
  gradient.addColorStop(1, "#04080d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 256);

  const rand = mulberry32(7);
  ctx.fillStyle = "#cfe8f2";
  for (let i = 0; i < 90; i += 1) {
    const x = rand() * 64;
    const y = rand() * 110;
    ctx.globalAlpha = 0.3 + rand() * 0.6;
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.globalAlpha = 1;
  texture.needsUpdate = true;
  return texture;
}

"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the memoized texture is intentionally mutated here.
 */

import { useEffect, useMemo, useState } from "react";
import type { CanvasTexture } from "three";

import { MONO, createCanvasTexture } from "./canvas-texture";

type LogTone = "ok" | "info" | "warn";
type LogLine = { tone: LogTone; text: string };

const LOG_POOL: LogLine[] = [
  { tone: "ok", text: "✓ deploy  origin/main → live  2.4s" },
  { tone: "info", text: "▸ build  pnpm test  18/18  ok" },
  { tone: "ok", text: "✓ axe-core  0 violations · 12 routes" },
  { tone: "info", text: "▸ web-vitals  LCP 0.9s  INP 124ms" },
  { tone: "ok", text: "✓ size-limit  93kb < 110kb  ok" },
  { tone: "info", text: "▸ /work prefetch  hot path warmed" },
  { tone: "ok", text: "✓ shader compile  3 frags  ok" },
  { tone: "warn", text: "⚠ flaky retry  → passed (1/3)" },
  { tone: "ok", text: "✓ ts-strict  0 errors · 218 modules" },
  { tone: "info", text: "▸ image pipeline  AVIF · WebP · 2x" },
  { tone: "ok", text: "✓ a11y axe  contrast AA  patterns" },
  { tone: "info", text: "▸ rsc cache  hit/miss  21 / 4" },
];

function toneRGBA(tone: LogTone, opacity: number): string {
  if (tone === "ok") return `rgba(125, 232, 200, ${opacity})`;
  if (tone === "warn") return `rgba(248, 198, 110, ${opacity})`;
  return `rgba(232, 246, 252, ${opacity * 0.88})`;
}

function drawTerminal(ctx: CanvasRenderingContext2D, lines: LogLine[]): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(34, 211, 238, 0.025)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  ctx.textBaseline = "top";
  ctx.fillStyle = "#22d3ee";
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("● OPS.LIVE · PRODUCTION", 30, 30);

  const time = new Date().toISOString().slice(11, 19);
  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = "rgba(232,246,252,0.45)";
  const tw = ctx.measureText(time).width;
  ctx.fillText(time, W - 30 - tw, 34);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 70);
  ctx.lineTo(W - 30, 70);
  ctx.stroke();

  ctx.font = `22px ${MONO}`;
  const startY = 94;
  const lineH = 32;
  const visible = lines.slice(-8);
  for (let i = 0; i < visible.length; i += 1) {
    const line = visible[i];
    if (!line) continue;
    const opacity = 0.4 + (i / Math.max(visible.length - 1, 1)) * 0.6;
    ctx.fillStyle = toneRGBA(line.tone, opacity);
    ctx.fillText(line.text, 30, startY + i * lineH);
  }
}

export function useCenterScreenTexture(): CanvasTexture {
  const { canvas, texture } = useMemo(() => createCanvasTexture(640, 400), []);
  const [lines, setLines] = useState<LogLine[]>(() => LOG_POOL.slice(0, 8));

  useEffect(() => {
    let i = 8;
    const id = window.setInterval(() => {
      setLines((prev) => {
        const next = prev.slice(1);
        const line = LOG_POOL[i % LOG_POOL.length];
        if (line) next.push(line);
        i += 1;
        return next;
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawTerminal(ctx, lines);
    texture.needsUpdate = true;
  }, [canvas, lines, texture]);

  return texture;
}

"use client";

import { useEffect, useState } from "react";
import { type CanvasTexture } from "three";
import { mulberry32 } from "@/utils/mulberry32";
import { worldColors } from "../materials";
import { MONO, INK, scanlines } from "./kit";
import { useScreenTexture } from "../screens/texture";

/**
 * What is playing on the lounge TV: three channels, the frame that wraps them, and the hook
 * that repaints on a clock. The channels are the reason this is one file — they are a closed
 * set behind `CHANNELS`, and the wrapper decides which one is on air.
 */

type Ctx = CanvasRenderingContext2D;

const HORIZON = 200;

function drawSun(ctx: Ctx, w: number): void {
  const cx = w / 2;
  const cy = HORIZON - 34;
  const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, 92);
  glow.addColorStop(0, "rgba(103, 232, 249, 0.55)");
  glow.addColorStop(1, "rgba(34, 211, 238, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = worldColors.accentBright;
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#060a0e";
  for (let i = 0; i < 6; i += 1) ctx.fillRect(cx - 46, cy + 8 + i * 7, 92, 3 + i);
}

function drawPerspectiveGrid(ctx: Ctx, w: number, h: number, tick: number): void {
  ctx.strokeStyle = worldColors.accent;
  ctx.lineWidth = 1.4;
  const vanishX = w / 2;
  const scroll = (tick * 0.04) % 1;
  for (let i = 0; i < 14; i += 1) {
    const t = (i + scroll) / 14;
    const y = HORIZON + t * t * (h - HORIZON);
    ctx.globalAlpha = 0.12 + (1 - t) * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let i = -10; i <= 10; i += 1) {
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(vanishX + i * 14, HORIZON);
    ctx.lineTo(vanishX + i * 64, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawGridChannel(ctx: Ctx, tick: number): void {
  const { width: w, height: h } = ctx.canvas;
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, "#04070b");
  sky.addColorStop(1, "#0a1a26");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, HORIZON);
  ctx.fillStyle = worldColors.accentSoft;
  for (let i = 0; i < 40; i += 1) {
    ctx.globalAlpha = 0.15 + Math.abs(Math.sin(tick * 0.08 + i)) * 0.5;
    ctx.fillRect((i * 67) % w, (i * 31) % (HORIZON - 30), 2, 2);
  }
  ctx.globalAlpha = 1;
  drawSun(ctx, w);
  ctx.fillStyle = "#060a0e";
  ctx.fillRect(0, HORIZON, w, h - HORIZON);
  drawPerspectiveGrid(ctx, w, h, tick);
}

const LINES = [
  'import { deploy } from "@/ci";',
  "",
  "export async function ship() {",
  "  const build = await compile();",
  "  if (!build.ok) throw build.error;",
  "  await deploy(build.artifact);",
  '  return { status: "live" };',
  "}",
  "",
  "// streaming build in public",
  "ship().then(log).catch(report);",
];

function tokenColor(line: string): string {
  if (line.startsWith("//")) return "rgba(125, 211, 252, 0.45)";
  if (/import|export|return/.test(line)) return "#67e8f9";
  if (/await|async|throw|const/.test(line)) return "#7dd3fc";
  return "#cfeefb";
}

function drawCodeChannel(ctx: Ctx, tick: number): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#060a0f";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(34, 211, 238, 0.05)";
  ctx.fillRect(0, 0, 46, h);

  const lineHeight = 26;
  const top = 38;
  const scroll = Math.floor(tick / 6) % LINES.length;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = `15px ${MONO}`;
  for (let i = 0; i < LINES.length; i += 1) {
    const idx = (i + scroll) % LINES.length;
    const line = LINES[idx] ?? "";
    const y = top + i * lineHeight;
    ctx.fillStyle = "rgba(125, 211, 252, 0.3)";
    ctx.fillText(String(idx + 1).padStart(2, "0"), 14, y);
    ctx.fillStyle = tokenColor(line);
    ctx.fillText(line, 54, y);
  }
  if (tick % 8 < 4) {
    ctx.fillStyle = worldColors.accentBright;
    ctx.fillRect(54, top + (LINES.length - 1) * lineHeight, 9, 17);
  }
}

function waveY(x: number, tick: number, midY: number): number {
  return midY - (Math.sin(x * 0.02 + tick * 0.12) * 36 + Math.sin(x * 0.05 + tick * 0.08) * 16);
}

function drawWaveGrid(ctx: Ctx, w: number, h: number): void {
  ctx.strokeStyle = "rgba(34, 211, 238, 0.1)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawWaveChannel(ctx: Ctx, tick: number): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#05090d";
  ctx.fillRect(0, 0, w, h);
  drawWaveGrid(ctx, w, h);

  const midY = h / 2 + 12;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  for (let x = 0; x <= w; x += 6) ctx.lineTo(x, waveY(x, tick, midY));
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, midY - 60, 0, h);
  fill.addColorStop(0, "rgba(34, 211, 238, 0.35)");
  fill.addColorStop(1, "rgba(34, 211, 238, 0)");
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.strokeStyle = worldColors.accentBright;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 6) {
    const y = waveY(x, tick, midY);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = worldColors.accentSoft;
  ctx.font = `bold 16px ${MONO}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("TELEMETRY", 18, 26);
}

export type Channel = {
  name: string;
  draw: (ctx: CanvasRenderingContext2D, tick: number) => void;
};

export const CHANNELS: readonly Channel[] = [
  { name: "CH-01 \u00B7 GRID", draw: drawGridChannel },
  { name: "CH-02 \u00B7 LIVE CODE", draw: drawCodeChannel },
  { name: "CH-03 \u00B7 TELEMETRY", draw: drawWaveChannel },
];

const PROGRESS_CYCLE = 300;
const TOTAL_SECONDS = 612;
const CHANNEL_TICKS = 90;

/** The television is film, not phosphor: its scanlines darken rather than tint. */
const TV_SCANLINE = "rgba(0, 0, 0, 0.12)";

export type LoungeTvState = { tick: number };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function drawStatic(ctx: CanvasRenderingContext2D, rand: () => number): void {
  const { width, height } = ctx.canvas;
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(160, 220, 240, ${rand() * 0.4})`;
    ctx.fillRect(rand() * width, rand() * height, 2, 2);
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, tick: number, name: string): void {
  const { width, height } = ctx.canvas;
  const progress = (tick % PROGRESS_CYCLE) / PROGRESS_CYCLE;
  const head = 18 + (width - 36) * progress;
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, width, 22);
  ctx.fillRect(0, height - 40, width, 40);

  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(232, 246, 252, 0.8)";
  ctx.font = `12px ${MONO}`;
  ctx.fillText(name, 18, 5);
  if (tick % 12 < 8) {
    ctx.fillStyle = "#ff5d5d";
    ctx.beginPath();
    ctx.arc(width - 74, 11, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(232, 246, 252, 0.85)";
  ctx.textAlign = "right";
  ctx.fillText("LIVE", width - 18, 5);

  const y = height - 24;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(232, 246, 252, 0.25)";
  ctx.beginPath();
  ctx.moveTo(18, y);
  ctx.lineTo(width - 18, y);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(18, y);
  ctx.lineTo(head, y);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(head, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;

  ctx.fillStyle = "rgba(232, 246, 252, 0.7)";
  ctx.font = `11px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText(`\u25B6 ${formatTime(progress * TOTAL_SECONDS)}`, 18, y + 8);
  ctx.textAlign = "right";
  ctx.fillText(formatTime(TOTAL_SECONDS), width - 18, y + 8);
  ctx.textAlign = "left";
}

export function drawLoungeTv(ctx: CanvasRenderingContext2D, state: LoungeTvState): void {
  const index = Math.floor(state.tick / CHANNEL_TICKS) % CHANNELS.length;
  const channel = CHANNELS[index];
  if (!channel) return;
  channel.draw(ctx, state.tick);
  if (state.tick % CHANNEL_TICKS < 2) drawStatic(ctx, mulberry32(state.tick));
  scanlines(ctx, TV_SCANLINE);
  drawOverlay(ctx, state.tick, channel.name);
}

const TICK_MS = 110;

export function useLoungeTvTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(640, 360);
  const [state, setState] = useState<LoungeTvState>(() => ({ tick: 0 }));

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((prev) => ({ tick: prev.tick + 1 }));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    paint((ctx) => drawLoungeTv(ctx, state));
  }, [paint, state]);

  return texture;
}

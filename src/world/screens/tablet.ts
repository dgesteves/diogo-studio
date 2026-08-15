"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type CanvasTexture } from "three";
import { worldColors } from "../materials";
import { MONO } from "./kit";
import { useScreenTexture } from "./texture";

/**
 * The drawing tablet's screen — chrome, the pressure-varying stroke, and the frame loop that
 * advances it. Separate from `monitors.ts` because it has a different consumer
 * (`scene/tablet.tsx`), a different aspect ratio and chrome nothing else draws.
 */

const GRID_STEP = 42;
const TOOL_COUNT = 5;
const ACTIVE_TOOL = 1;

function drawGrid(ctx: CanvasRenderingContext2D): void {
  const { width: W, height: H } = ctx.canvas;
  ctx.strokeStyle = "rgba(34, 211, 238, 0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = GRID_STEP; x < W; x += GRID_STEP) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = GRID_STEP; y < H; y += GRID_STEP) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
}

function drawHeader(ctx: CanvasRenderingContext2D): void {
  const { width: W } = ctx.canvas;
  ctx.textBaseline = "top";
  ctx.fillStyle = worldColors.accent;
  ctx.font = `bold 20px ${MONO}`;
  ctx.fillText("SKETCH", 22, 20);
  ctx.fillStyle = "rgba(232, 246, 252, 0.4)";
  ctx.font = `15px ${MONO}`;
  ctx.fillText("layer 02", W - 116, 23);
  ctx.strokeStyle = "rgba(34, 211, 238, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(22, 52);
  ctx.lineTo(W - 22, 52);
  ctx.stroke();
}

function drawTools(ctx: CanvasRenderingContext2D): void {
  const { width: W, height: H } = ctx.canvas;
  const radius = 13;
  const gap = 16;
  const span = TOOL_COUNT * radius * 2 + (TOOL_COUNT - 1) * gap;
  const centerY = H - 44;

  for (let i = 0; i < TOOL_COUNT; i += 1) {
    const centerX = (W - span) / 2 + radius + i * (radius * 2 + gap);
    ctx.fillStyle = i === ACTIVE_TOOL ? worldColors.accent : "rgba(232, 246, 252, 0.14)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export type TabletView = {
  progress: number;
  pressure: number;
};

const STROKE_SAMPLES = 180;

function strokeAt(t: number, W: number, H: number): readonly [number, number] {
  const x = W * (0.16 + 0.68 * t);
  const y = H * (0.66 - 0.32 * t + 0.14 * Math.sin(t * Math.PI * 2.4));
  return [x, y];
}

function traceStroke(ctx: CanvasRenderingContext2D, count: number): void {
  const { width: W, height: H } = ctx.canvas;
  ctx.beginPath();
  for (let i = 0; i < count; i += 1) {
    const [x, y] = strokeAt(i / (STROKE_SAMPLES - 1), W, H);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function drawStroke(ctx: CanvasRenderingContext2D, view: TabletView): void {
  const { width: W, height: H } = ctx.canvas;
  const count = Math.max(2, Math.round(STROKE_SAMPLES * view.progress));

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  traceStroke(ctx, count);
  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 15;
  ctx.stroke();
  ctx.strokeStyle = "rgba(236, 250, 255, 0.92)";
  ctx.lineWidth = 4 + view.pressure * 2.5;
  ctx.stroke();

  const [headX, headY] = strokeAt((count - 1) / (STROKE_SAMPLES - 1), W, H);
  ctx.fillStyle = worldColors.accentBright;
  ctx.beginPath();
  ctx.arc(headX, headY, 5.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTablet(ctx: CanvasRenderingContext2D, view: TabletView): void {
  const { width: W, height: H } = ctx.canvas;
  ctx.fillStyle = "#04080b";
  ctx.fillRect(0, 0, W, H);
  drawGrid(ctx);
  drawHeader(ctx);
  drawStroke(ctx, view);
  drawTools(ctx);
}

const TEXTURE_WIDTH = 358;
const TEXTURE_HEIGHT = 512;
const REDRAW_INTERVAL = 1 / 15;
const STROKE_SECONDS = 5;
const HOLD_SECONDS = 1.8;

export function useTabletScreenTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const elapsed = useRef(0);
  const sinceRedraw = useRef(REDRAW_INTERVAL);

  useFrame((_, delta) => {
    elapsed.current = (elapsed.current + delta) % (STROKE_SECONDS + HOLD_SECONDS);
    sinceRedraw.current += delta;
    if (sinceRedraw.current < REDRAW_INTERVAL) return;
    sinceRedraw.current = 0;

    paint((ctx) =>
      drawTablet(ctx, {
        progress: Math.min(1, elapsed.current / STROKE_SECONDS),
        pressure: 0.5 + 0.5 * Math.sin(elapsed.current * 2.4),
      }),
    );
  });

  return texture;
}

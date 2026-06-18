import { MONO } from "@/features/studio/components/screens/canvas-texture";

import { CHANNELS } from "./lounge-tv-channels";

const PROGRESS_CYCLE = 300;
const TOTAL_SECONDS = 612;
const CHANNEL_TICKS = 90;
const INK = "#e8f6fc";

export type LoungeTvState = { tick: number };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function drawScanlines(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, 1);
}

function drawStatic(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas;
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(160, 220, 240, ${Math.random() * 0.4})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
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
  if (state.tick % CHANNEL_TICKS < 2) drawStatic(ctx);
  drawScanlines(ctx);
  drawOverlay(ctx, state.tick, channel.name);
}

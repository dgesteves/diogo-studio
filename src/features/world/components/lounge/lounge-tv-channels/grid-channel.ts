import { brandColors } from "@/config/brand";

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
  ctx.fillStyle = brandColors.accentBright;
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#060a0e";
  for (let i = 0; i < 6; i += 1) ctx.fillRect(cx - 46, cy + 8 + i * 7, 92, 3 + i);
}

function drawGrid(ctx: Ctx, w: number, h: number, tick: number): void {
  ctx.strokeStyle = brandColors.accent;
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

export function drawGridChannel(ctx: Ctx, tick: number): void {
  const { width: w, height: h } = ctx.canvas;
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, "#04070b");
  sky.addColorStop(1, "#0a1a26");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, HORIZON);
  ctx.fillStyle = brandColors.accentSoft;
  for (let i = 0; i < 40; i += 1) {
    ctx.globalAlpha = 0.15 + Math.abs(Math.sin(tick * 0.08 + i)) * 0.5;
    ctx.fillRect((i * 67) % w, (i * 31) % (HORIZON - 30), 2, 2);
  }
  ctx.globalAlpha = 1;
  drawSun(ctx, w);
  ctx.fillStyle = "#060a0e";
  ctx.fillRect(0, HORIZON, w, h - HORIZON);
  drawGrid(ctx, w, h, tick);
}

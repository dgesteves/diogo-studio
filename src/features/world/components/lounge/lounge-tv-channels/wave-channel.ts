import { brandColors } from "@/config/brand";
import { MONO } from "@/features/studio/components/screens/canvas-texture";

type Ctx = CanvasRenderingContext2D;

function waveY(x: number, tick: number, midY: number): number {
  return midY - (Math.sin(x * 0.02 + tick * 0.12) * 36 + Math.sin(x * 0.05 + tick * 0.08) * 16);
}

function drawGrid(ctx: Ctx, w: number, h: number): void {
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

export function drawWaveChannel(ctx: Ctx, tick: number): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#05090d";
  ctx.fillRect(0, 0, w, h);
  drawGrid(ctx, w, h);

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

  ctx.strokeStyle = brandColors.accentBright;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 6) {
    const y = waveY(x, tick, midY);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = brandColors.accentSoft;
  ctx.font = `bold 16px ${MONO}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("TELEMETRY", 18, 26);
}

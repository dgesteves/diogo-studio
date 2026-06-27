import { brandColors } from "@/config/brand";
import { MONO } from "./canvas-texture";

export type MetricsView = {
  fps: number;
  frameMs: number;
  history: readonly number[];
  resolution: string;
  dpr: number;
};

const FPS_SCALE = 72;

function drawSparkline(ctx: CanvasRenderingContext2D, history: readonly number[]): void {
  const W = ctx.canvas.width;
  const sparkX = 250;
  const sparkY = 116;
  const sparkW = W - sparkX - 30;
  const sparkH = 64;
  ctx.strokeStyle = brandColors.accent;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < history.length; i += 1) {
    const value = Math.max(0, Math.min(1, (history[i] ?? 0) / FPS_SCALE));
    const x = sparkX + (i / Math.max(history.length - 1, 1)) * sparkW;
    const y = sparkY + (1 - value) * sparkH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export function drawMetrics(ctx: CanvasRenderingContext2D, view: MetricsView): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(34, 211, 238, 0.025)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  ctx.textBaseline = "top";
  ctx.fillStyle = brandColors.accent;
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("● RENDER · LIVE", 30, 30);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 70);
  ctx.lineTo(W - 30, 70);
  ctx.stroke();

  ctx.fillStyle = "rgba(232,246,252,0.55)";
  ctx.font = `16px ${MONO}`;
  ctx.fillText("FRAMES / SEC", 30, 90);
  ctx.fillStyle = "#e8f6fc";
  ctx.font = `bold 64px ${MONO}`;
  ctx.fillText(String(Math.round(view.fps)), 30, 110);

  drawSparkline(ctx, view.history);

  const rows = [
    { label: "frame", value: `${view.frameMs.toFixed(1)} ms` },
    { label: "res", value: view.resolution },
    { label: "dpr", value: `${view.dpr.toFixed(2)}×` },
  ];
  ctx.font = `20px ${MONO}`;
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    if (!row) continue;
    const y = 222 + r * 40;
    ctx.fillStyle = "rgba(125, 232, 200, 0.85)";
    ctx.fillText(row.label, 30, y);
    ctx.fillStyle = "rgba(232,246,252,0.72)";
    ctx.fillText(row.value, 150, y);
  }
}

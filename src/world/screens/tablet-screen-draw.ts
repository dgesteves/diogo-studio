import { worldColors } from "@/world/materials";
import { drawGrid, drawHeader, drawTools } from "./tablet-screen-chrome";

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

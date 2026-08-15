import { worldColors } from "@/world/materials";
import { MONO } from "@/world/screens/kit";

const GRID_STEP = 42;
const TOOL_COUNT = 5;
const ACTIVE_TOOL = 1;

export function drawGrid(ctx: CanvasRenderingContext2D): void {
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

export function drawHeader(ctx: CanvasRenderingContext2D): void {
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

export function drawTools(ctx: CanvasRenderingContext2D): void {
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

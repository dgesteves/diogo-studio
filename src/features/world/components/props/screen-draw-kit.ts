import { MONO } from "@/features/studio/components/screens/canvas-texture";

export const INK = "#e8f6fc";
export const SOFT = "rgba(232,246,252,0.55)";
export const LINE = "rgba(34, 211, 238, 0.18)";

export function paintBackground(ctx: CanvasRenderingContext2D, accent: string): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(34, 211, 238, 0.025)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.08;
  ctx.fillRect(0, 0, W, 6);
  ctx.globalAlpha = 1;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
}

export function header(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  accent: string,
): void {
  ctx.fillStyle = accent;
  ctx.font = `bold 32px ${MONO}`;
  ctx.fillText(title, 36, 40);
  ctx.fillStyle = SOFT;
  ctx.font = `15px ${MONO}`;
  ctx.fillText(subtitle, 36, 80);
  divider(ctx, 116);
}

export function divider(ctx: CanvasRenderingContext2D, y: number): void {
  const W = ctx.canvas.width;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, y);
  ctx.lineTo(W - 36, y);
  ctx.stroke();
}

export function section(
  ctx: CanvasRenderingContext2D,
  label: string,
  y: number,
  accent: string,
): void {
  ctx.fillStyle = accent;
  ctx.font = `bold 18px ${MONO}`;
  ctx.fillText(label, 36, y);
}

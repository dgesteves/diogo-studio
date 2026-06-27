import { brandColors } from "@/config/brand";

import { MONO } from "./canvas-texture";
import type { StatusRow } from "./terminal-screen-data";

export type StatusView = {
  rows: readonly StatusRow[];
  time: string;
  date: string;
  uptime: string;
  focus: string;
};

function fitValue(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  let value = text;
  while (value.length > 1 && ctx.measureText(value).width > maxWidth) {
    value = `${value.slice(0, -2)}…`;
  }
  return value;
}

export function drawTerminal(ctx: CanvasRenderingContext2D, view: StatusView): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(34, 211, 238, 0.025)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  ctx.textBaseline = "top";
  ctx.fillStyle = brandColors.accent;
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("● STUDIO · LIVE", 30, 30);

  ctx.font = `bold 20px ${MONO}`;
  ctx.fillStyle = "rgba(232,246,252,0.62)";
  const tw = ctx.measureText(view.time).width;
  ctx.fillText(view.time, W - 30 - tw, 32);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 70);
  ctx.lineTo(W - 30, 70);
  ctx.stroke();

  const rows: StatusRow[] = [
    ...view.rows,
    { label: "focus", value: view.focus },
    { label: "local", value: `${view.time} · ${view.date}` },
    { label: "uptime", value: view.uptime },
  ];

  const startY = 96;
  const lineH = 38;
  const valueX = 168;
  const maxValueWidth = W - valueX - 30;
  ctx.font = `20px ${MONO}`;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    const y = startY + i * lineH;
    ctx.fillStyle = "rgba(125, 232, 200, 0.85)";
    ctx.fillText(row.label, 30, y);
    ctx.fillStyle = "rgba(34, 211, 238, 0.5)";
    ctx.fillText("▸", valueX - 30, y);
    ctx.fillStyle = "rgba(232,246,252,0.72)";
    ctx.fillText(fitValue(ctx, row.value, maxValueWidth), valueX, y);
  }
}

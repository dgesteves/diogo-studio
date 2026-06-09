import { brandColors } from "@/config/brand";

import { MONO } from "./canvas-texture";
import type { LogLine, LogTone } from "./terminal-screen-data";

function toneRGBA(tone: LogTone, opacity: number): string {
  if (tone === "ok") return `rgba(125, 232, 200, ${opacity})`;
  if (tone === "warn") return `rgba(248, 198, 110, ${opacity})`;
  return `rgba(232, 246, 252, ${opacity * 0.88})`;
}

export function drawTerminal(ctx: CanvasRenderingContext2D, lines: LogLine[]): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(34, 211, 238, 0.025)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  ctx.textBaseline = "top";
  ctx.fillStyle = brandColors.accent;
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("● OPS.LIVE · PRODUCTION", 30, 30);

  const time = new Date().toISOString().slice(11, 19);
  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = "rgba(232,246,252,0.45)";
  const tw = ctx.measureText(time).width;
  ctx.fillText(time, W - 30 - tw, 34);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 70);
  ctx.lineTo(W - 30, 70);
  ctx.stroke();

  ctx.font = `22px ${MONO}`;
  const startY = 94;
  const lineH = 32;
  const visible = lines.slice(-8);
  for (let i = 0; i < visible.length; i += 1) {
    const line = visible[i];
    if (!line) continue;
    const opacity = 0.4 + (i / Math.max(visible.length - 1, 1)) * 0.6;
    ctx.fillStyle = toneRGBA(line.tone, opacity);
    ctx.fillText(line.text, 30, startY + i * lineH);
  }
}

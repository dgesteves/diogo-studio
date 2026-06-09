import { brandColors } from "@/config/brand";

import { MONO } from "./canvas-texture";
import { CODE_LINES, CODE_TOKENS } from "./code-screen-data";

export function drawCode(ctx: CanvasRenderingContext2D, caretOn: boolean): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(125, 211, 252, 0.02)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  ctx.textBaseline = "top";
  ctx.fillStyle = brandColors.accentSoft;
  ctx.font = `bold 20px ${MONO}`;
  ctx.fillText("● src/lib/agents/runtime.ts", 30, 30);

  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = "rgba(232,246,252,0.4)";
  ctx.fillText("ts", W - 60, 34);

  ctx.strokeStyle = "rgba(125, 211, 252, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 68);
  ctx.lineTo(W - 30, 68);
  ctx.stroke();

  const startY = 90;
  const gutterX = 30;
  const codeX = 80;
  const lineH = 26;
  ctx.font = `20px ${MONO}`;

  for (let i = 0; i < CODE_LINES.length; i += 1) {
    const line = CODE_LINES[i];
    if (!line) continue;
    const y = startY + i * lineH;

    ctx.fillStyle = "rgba(232,246,252,0.28)";
    ctx.font = `16px ${MONO}`;
    const numText = String(i + 12).padStart(2, " ");
    ctx.fillText(numText, gutterX, y + 3);

    ctx.font = `20px ${MONO}`;
    let x = codeX;
    for (const token of line) {
      ctx.fillStyle = CODE_TOKENS[token.k];
      ctx.fillText(token.t, x, y);
      x += ctx.measureText(token.t).width;
    }

    if (i === 5 && caretOn) {
      ctx.fillStyle = brandColors.accentSoft;
      ctx.fillRect(x + 2, y, 2, 22);
    }
  }
}

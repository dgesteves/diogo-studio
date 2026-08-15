import { brandColors } from "@/config/brand";

import { divider, fillScreen, MONO, scanlines } from "@/world/screens/kit";
import { CODE_LINES, CODE_TOKENS } from "./code-screen-data";

/** The editor runs cooler than the rest of the room: blue phosphor rather than cyan. */
const EDITOR_SCANLINE = "rgba(125, 211, 252, 0.02)";
const EDITOR_LINE = "rgba(125, 211, 252, 0.18)";

export function drawCode(ctx: CanvasRenderingContext2D, caretOn: boolean): void {
  const W = ctx.canvas.width;

  fillScreen(ctx);
  scanlines(ctx, EDITOR_SCANLINE);

  ctx.textBaseline = "top";
  ctx.fillStyle = brandColors.accentSoft;
  ctx.font = `bold 20px ${MONO}`;
  ctx.fillText("● src/lib/agents/runtime.ts", 30, 30);

  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = "rgba(232,246,252,0.4)";
  ctx.fillText("ts", W - 60, 34);

  divider(ctx, 68, { margin: 30, color: EDITOR_LINE });

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

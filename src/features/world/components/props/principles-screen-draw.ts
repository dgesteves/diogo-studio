import { MONO } from "@/world/screens/texture";

import { header, INK, paintBackground, section } from "./screen-draw-kit";

const ACCENT = "#c084fc";

/** 800px of panel, at 78px a line, is seven. */
const MAX_PRACTICES = 7;

export function drawPrinciples(ctx: CanvasRenderingContext2D, practices: readonly string[]): void {
  paintBackground(ctx, ACCENT);
  header(ctx, "PRINCIPLES", "HOW I BUILD", ACCENT);
  section(ctx, "● OPERATING SYSTEM", 142, ACCENT);

  const lines = practices.slice(0, MAX_PRACTICES);
  const top = 196;
  const gap = 78;
  for (let i = 0; i < lines.length; i += 1) {
    const text = lines[i];
    if (!text) continue;
    const y = top + i * gap;
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 22px ${MONO}`;
    ctx.fillText(String(i + 1).padStart(2, "0"), 36, y);
    ctx.fillStyle = INK;
    ctx.font = `18px ${MONO}`;
    ctx.fillText(text, 88, y + 2);
  }
}

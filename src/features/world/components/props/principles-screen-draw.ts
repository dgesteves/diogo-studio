import { MONO } from "@/features/studio/components/screens/canvas-texture";

import { header, INK, paintBackground, section } from "./screen-draw-kit";

const ACCENT = "#c084fc";

const PRINCIPLES: string[] = [
  "Ship small, ship often",
  "Accessibility is non-negotiable",
  "Performance is a feature",
  "Type-safe at every boundary",
  "Design systems scale teams",
  "Automate the boring parts",
  "Clarity over cleverness",
];

export function drawPrinciples(ctx: CanvasRenderingContext2D): void {
  paintBackground(ctx, ACCENT);
  header(ctx, "PRINCIPLES", "HOW I BUILD", ACCENT);
  section(ctx, "● OPERATING SYSTEM", 142, ACCENT);

  const top = 196;
  const gap = 78;
  for (let i = 0; i < PRINCIPLES.length; i += 1) {
    const text = PRINCIPLES[i];
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

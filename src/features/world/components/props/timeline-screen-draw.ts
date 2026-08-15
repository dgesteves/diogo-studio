import type { Engagement } from "@/content/career";
import { MONO } from "@/world/screens/texture";

import { header, INK, paintBackground, section, SOFT } from "./screen-draw-kit";

const ACCENT = "#a78bfa";

/** The panel is 600×800 and every stop needs 90px, so it shows the most recent six. */
const MAX_STOPS = 6;

export function drawTimeline(
  ctx: CanvasRenderingContext2D,
  engagements: readonly Engagement[],
): void {
  const STOPS = engagements.slice(0, MAX_STOPS);
  const earliest = STOPS.at(-1)?.start.slice(0, 4) ?? "";

  paintBackground(ctx, ACCENT);
  header(ctx, "TIMELINE", `${earliest} → NOW`, ACCENT);
  section(ctx, "● CAREER", 142, ACCENT);

  const x = 56;
  const top = 200;
  const gap = 90;
  const bottom = top + (STOPS.length - 1) * gap;

  ctx.strokeStyle = "rgba(167,139,250,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, bottom);
  ctx.stroke();

  for (let i = 0; i < STOPS.length; i += 1) {
    const stop = STOPS[i];
    if (!stop) continue;
    const y = top + i * gap;
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SOFT;
    ctx.font = `13px ${MONO}`;
    ctx.fillText(stop.start.slice(0, 4), x + 26, y - 24);
    ctx.fillStyle = INK;
    ctx.font = `bold 19px ${MONO}`;
    ctx.fillText(stop.role, x + 26, y - 6);
    ctx.fillStyle = SOFT;
    ctx.font = `14px ${MONO}`;
    ctx.fillText(stop.company, x + 26, y + 20);
  }
}

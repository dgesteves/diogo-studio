import { MONO } from "@/features/studio/components/screens/canvas-texture";

import { header, INK, paintBackground, section, SOFT } from "./screen-draw-kit";

const ACCENT = "#a78bfa";

type Stop = { year: string; title: string; org: string };

const STOPS: Stop[] = [
  { year: "2025", title: "Lead Engineer", org: "Fueled" },
  { year: "2025", title: "VP of Engineering", org: "Moment" },
  { year: "2023", title: "Lead Frontend", org: "eino.ai" },
  { year: "2020", title: "Senior Engineer", org: "Sky · NBCUniversal" },
  { year: "2018", title: "Lead Frontend", org: "BMW Group" },
  { year: "2015", title: "Frontend Engineer", org: "Studio era" },
];

export function drawTimeline(ctx: CanvasRenderingContext2D): void {
  paintBackground(ctx, ACCENT);
  header(ctx, "TIMELINE", "2015 → NOW", ACCENT);
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
    ctx.fillText(stop.year, x + 26, y - 24);
    ctx.fillStyle = INK;
    ctx.font = `bold 19px ${MONO}`;
    ctx.fillText(stop.title, x + 26, y - 6);
    ctx.fillStyle = SOFT;
    ctx.font = `14px ${MONO}`;
    ctx.fillText(stop.org, x + 26, y + 20);
  }
}

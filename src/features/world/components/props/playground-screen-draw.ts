import type { Experiment } from "@/content/playground";
import { MONO } from "@/world/screens/texture";

import { header, INK, paintBackground, section, SOFT } from "./screen-draw-kit";

const ACCENT = "#facc15";

/** 800px of panel, at 86px a row and leaving space for the footer, is five. */
const MAX_EXPERIMENTS = 5;

export function drawPlayground(
  ctx: CanvasRenderingContext2D,
  experiments: readonly Experiment[],
): void {
  paintBackground(ctx, ACCENT);
  header(ctx, "PLAYGROUND", "EXPERIMENTS · DEMOS", ACCENT);
  section(ctx, "● HIGH SCORES", 142, ACCENT);

  const rows = experiments.slice(0, MAX_EXPERIMENTS);
  const top = 200;
  const gap = 86;
  for (let i = 0; i < rows.length; i += 1) {
    const experiment = rows[i];
    if (!experiment) continue;
    const y = top + i * gap;
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 18px ${MONO}`;
    ctx.fillText(`P${i + 1}`, 36, y);
    ctx.fillStyle = INK;
    ctx.font = `19px ${MONO}`;
    ctx.fillText(experiment.title, 92, y);
    ctx.fillStyle = SOFT;
    ctx.font = `14px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(experiment.meta, ctx.canvas.width - 36, y + 2);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = ACCENT;
  ctx.font = `bold 16px ${MONO}`;
  ctx.fillText("▶ PRESS START", 36, 700);
}

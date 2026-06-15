import { MONO } from "@/features/studio/components/screens/canvas-texture";

import { header, INK, paintBackground, section, SOFT } from "./screen-draw-kit";

const ACCENT = "#facc15";

type Experiment = { title: string; tag: string };

const EXPERIMENTS: Experiment[] = [
  { title: "Shader playground", tag: "WebGL" },
  { title: "Generative art", tag: "Canvas" },
  { title: "Game prototypes", tag: "R3F" },
  { title: "Creative coding", tag: "p5" },
  { title: "Audio-reactive viz", tag: "WebAudio" },
];

export function drawPlayground(ctx: CanvasRenderingContext2D): void {
  paintBackground(ctx, ACCENT);
  header(ctx, "PLAYGROUND", "EXPERIMENTS · DEMOS", ACCENT);
  section(ctx, "● HIGH SCORES", 142, ACCENT);

  const top = 200;
  const gap = 86;
  for (let i = 0; i < EXPERIMENTS.length; i += 1) {
    const exp = EXPERIMENTS[i];
    if (!exp) continue;
    const y = top + i * gap;
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 18px ${MONO}`;
    ctx.fillText(`P${i + 1}`, 36, y);
    ctx.fillStyle = INK;
    ctx.font = `19px ${MONO}`;
    ctx.fillText(exp.title, 92, y);
    ctx.fillStyle = SOFT;
    ctx.font = `14px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(exp.tag, ctx.canvas.width - 36, y + 2);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = ACCENT;
  ctx.font = `bold 16px ${MONO}`;
  ctx.fillText("▶ PRESS START", 36, 700);
}

import { MONO } from "@/features/studio/components/screens/canvas-texture";

import { header, INK, paintBackground, section } from "./screen-draw-kit";

const ACCENT = "#7dd3fc";

type Group = { label: string; items: string[] };

const GROUPS: Group[] = [
  { label: "FRONTEND", items: ["React 19", "Next.js", "TypeScript"] },
  { label: "3D / MOTION", items: ["Three.js", "R3F", "GSAP"] },
  { label: "STYLING", items: ["Tailwind", "Radix", "shadcn/ui"] },
  { label: "PLATFORM", items: ["Node", "Edge", "Vercel"] },
  { label: "QUALITY", items: ["Vitest", "Playwright", "ESLint"] },
  { label: "AI", items: ["RAG", "Embeddings", "LLM UX"] },
];

export function drawStack(ctx: CanvasRenderingContext2D): void {
  paintBackground(ctx, ACCENT);
  header(ctx, "STACK", "TOOLS OF THE TRADE", ACCENT);
  section(ctx, "● TOOLKIT", 142, ACCENT);

  const top = 188;
  const gap = 96;
  for (let i = 0; i < GROUPS.length; i += 1) {
    const group = GROUPS[i];
    if (!group) continue;
    const y = top + i * gap;
    ctx.fillStyle = ACCENT;
    ctx.font = `bold 14px ${MONO}`;
    ctx.fillText(group.label, 36, y);

    ctx.font = `16px ${MONO}`;
    let cx = 36;
    const py = y + 26;
    for (const item of group.items) {
      const w = ctx.measureText(item).width + 28;
      ctx.fillStyle = "rgba(125,211,252,0.12)";
      ctx.beginPath();
      ctx.roundRect(cx, py, w, 34, 9);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillText(item, cx + 14, py + 9);
      cx += w + 12;
    }
  }
}

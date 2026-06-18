import { brandColors } from "@/config/brand";
import { MONO } from "@/features/studio/components/screens/canvas-texture";

type Ctx = CanvasRenderingContext2D;

const LINES = [
  'import { deploy } from "@/ci";',
  "",
  "export async function ship() {",
  "  const build = await compile();",
  "  if (!build.ok) throw build.error;",
  "  await deploy(build.artifact);",
  '  return { status: "live" };',
  "}",
  "",
  "// streaming build in public",
  "ship().then(log).catch(report);",
];

function tokenColor(line: string): string {
  if (line.startsWith("//")) return "rgba(125, 211, 252, 0.45)";
  if (/import|export|return/.test(line)) return "#67e8f9";
  if (/await|async|throw|const/.test(line)) return "#7dd3fc";
  return "#cfeefb";
}

export function drawCodeChannel(ctx: Ctx, tick: number): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#060a0f";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(34, 211, 238, 0.05)";
  ctx.fillRect(0, 0, 46, h);

  const lineHeight = 26;
  const top = 38;
  const scroll = Math.floor(tick / 6) % LINES.length;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.font = `15px ${MONO}`;
  for (let i = 0; i < LINES.length; i += 1) {
    const idx = (i + scroll) % LINES.length;
    const line = LINES[idx] ?? "";
    const y = top + i * lineHeight;
    ctx.fillStyle = "rgba(125, 211, 252, 0.3)";
    ctx.fillText(String(idx + 1).padStart(2, "0"), 14, y);
    ctx.fillStyle = tokenColor(line);
    ctx.fillText(line, 54, y);
  }
  if (tick % 8 < 4) {
    ctx.fillStyle = brandColors.accentBright;
    ctx.fillRect(54, top + (LINES.length - 1) * lineHeight, 9, 17);
  }
}

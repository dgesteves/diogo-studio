/**
 * The CRT kit: what every screen in the room paints with, so that a wall panel, the desk
 * monitors and the lounge television read as the same hardware.
 *
 * These are primitives, not layouts — a caller composes them in its own order and adds its
 * own text. Where two screens genuinely differ (the code editor's cooler scanlines, the
 * television's darker ones, a 30px margin against the panels' 36px) the difference is a
 * parameter, because it is a real design decision and not an accident of three copies.
 *
 * Nothing here may contain a fact: a draw routine decides layout, typography, color, spacing
 * and truncation, and takes everything else as data. See `.claude/rules/project-structure.md`.
 */

export const MONO = `"Geist Mono", ui-monospace, Menlo, Consolas, monospace`;

export const INK = "#e8f6fc";
export const SOFT = "rgba(232,246,252,0.55)";

const LINE = "rgba(34, 211, 238, 0.18)";
const BACKDROP = "#03080c";
const SCANLINE = "rgba(34, 211, 238, 0.025)";
const SCANLINE_STEP = 3;

export function fillScreen(ctx: CanvasRenderingContext2D, color: string = BACKDROP): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/** The phosphor lines. Cheap, and the single strongest cue that this is a screen. */
export function scanlines(ctx: CanvasRenderingContext2D, color: string = SCANLINE): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = color;
  for (let y = 0; y < height; y += SCANLINE_STEP) ctx.fillRect(0, y, width, 1);
}

export function divider(
  ctx: CanvasRenderingContext2D,
  y: number,
  { margin = 36, color = LINE }: { margin?: number; color?: string } = {},
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(ctx.canvas.width - margin, y);
  ctx.stroke();
}

/** A wall panel's ground: backdrop, scanlines, an accent bar, and the text defaults. */
export function paintBackground(ctx: CanvasRenderingContext2D, accent: string): void {
  fillScreen(ctx);
  scanlines(ctx);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.08;
  ctx.fillRect(0, 0, ctx.canvas.width, 6);
  ctx.globalAlpha = 1;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
}

export function header(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  accent: string,
): void {
  ctx.fillStyle = accent;
  ctx.font = `bold 32px ${MONO}`;
  ctx.fillText(title, 36, 40);
  ctx.fillStyle = SOFT;
  ctx.font = `15px ${MONO}`;
  ctx.fillText(subtitle, 36, 80);
  divider(ctx, 116);
}

export function section(
  ctx: CanvasRenderingContext2D,
  label: string,
  y: number,
  accent: string,
): void {
  ctx.fillStyle = accent;
  ctx.font = `bold 18px ${MONO}`;
  ctx.fillText(label, 36, y);
}

/**
 * The longest prefix of `text` that fits `maxWidth`, elided. Truncation is the draw's call
 * rather than the record's — the page carries the whole of a string and a screen shows what
 * it has room for — so every routine that sets text into a fixed box needs this one.
 */
export function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  let value = text;
  while (value.length > 1 && ctx.measureText(value).width > maxWidth) {
    value = `${value.slice(0, -2)}…`;
  }
  return value;
}

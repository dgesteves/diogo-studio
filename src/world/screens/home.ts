/**
 * The home-screen kit: what the phone and the iPad both paint with.
 *
 * They are two devices showing one room, so the wallpaper, the icon tile, the lit tray and
 * the status indicators are the same picture at two sizes — and the *layouts* are not, which
 * is why those stay in `phone.ts` and `tablet.ts`. This is the same split `kit.ts` makes for
 * the room's CRTs: primitives here, composition at the call site.
 *
 * Neither screen is built out of `kit.ts`. Those are one machine's monitors, drawn on a
 * backdrop with scanlines and a rule under a header; a phone and a tablet are different
 * devices, so they have a different chrome — no scanlines, rounded artwork on a wallpaper —
 * and sharing the room's ground would make them read as two more panels of the same console.
 * What they do share is the typeface: every glyph in this room is the one mono stack, and a
 * device set in a UI sans would be the only object in here speaking a second language.
 *
 * Nothing here may contain a fact. An app arrives as a label and a color, a clock arrives
 * formatted, and these routines decide the tile, the monogram, the truncation and the paint.
 */

import { fit, INK, MONO } from "./kit";

/** One app on a home screen: what it is called, and the color its station is lit with. */
export type HomeApp = {
  readonly label: string;
  readonly accent: string;
};

/**
 * The paint box. These are pigments, not surfaces: they never reach a material, so they live
 * with the routines that strike them rather than in the room's surface list. The type is set
 * in the kit's ink, at the alphas these screens need — a device that wrote in a second white
 * would be the one screen in the room lit off a different bulb.
 *
 * The wallpaper is the room seen from inside the device — near-black with the studio's cyan
 * pooling at the top, because a bright wallpaper under a screen of lit icons is a white slab
 * from across the desk and nothing else.
 */
const WALLPAPER_TOP = "#08131c";
const WALLPAPER_BOTTOM = "#02060a";
const WALLPAPER_GLOW = "rgba(34, 211, 238, 0.22)";

export const LABEL_INK = "rgba(232, 246, 252, 0.88)";
/** The lit sheet the widget cards, the dock trays and the search pill are all cut from —
 *  filled alone for a pill, filled and edged by `paintTray` for a card. */
export const TRAY_FILL = "rgba(232, 246, 252, 0.10)";
const TRAY_EDGE = "rgba(232, 246, 252, 0.16)";
/** A monogram sits on a lit tile, so it is struck in the wallpaper rather than in ink. */
const GLYPH_INK = "#04080c";
const GLOSS_TOP = "rgba(255, 255, 255, 0.17)";
const GLOSS_NONE = "rgba(255, 255, 255, 0)";
const GLOSS_FOOT = "rgba(0, 0, 0, 0.42)";
/** Where the highlight has died out. Past about a fifth it stops being a catch of light and
 * starts bleaching the tile, and half of the room's accents are pale to begin with. */
const GLOSS_BREAK = 0.16;

/** iOS rounds an icon at 22.6% of its side. Below about a fifth it stops reading as one. */
const ICON_RADIUS = 0.226;

export const TAU = Math.PI * 2;

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

/**
 * Near-black, with the accent pooled behind the first row of icons. Two fills rather than
 * one gradient with a colored stop: the pool has to be a *place* on the wallpaper, and a
 * linear ramp puts it across the whole width at one height instead.
 */
export function paintWallpaper(ctx: CanvasRenderingContext2D): void {
  const { width: W, height: H } = ctx.canvas;

  const ground = ctx.createLinearGradient(0, 0, 0, H);
  ground.addColorStop(0, WALLPAPER_TOP);
  ground.addColorStop(1, WALLPAPER_BOTTOM);
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, W, H);

  const pool = ctx.createRadialGradient(W * 0.5, H * 0.1, 0, W * 0.5, H * 0.1, W * 0.95);
  pool.addColorStop(0, WALLPAPER_GLOW);
  pool.addColorStop(1, GLOSS_NONE);
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, W, H);
}

/** A lit sheet: the widget card, the dock tray. A blur would be invisible — a real one is the
 *  wallpaper behind it out of focus, and the wallpaper under these is a flat near-black. */
export function paintTray(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.fillStyle = TRAY_FILL;
  ctx.strokeStyle = TRAY_EDGE;
  ctx.lineWidth = Math.max(1, ctx.canvas.width * 0.0035);
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();
}

/**
 * One tile: the station's own color, a gloss down it, and the initials of the page it opens.
 * The gloss is painted as white and black over the accent rather than as a second color
 * derived from it — a draw routine has no business doing color math, and a lit tile that
 * catches the light at the top is the same picture either way.
 */
export function paintIcon(
  ctx: CanvasRenderingContext2D,
  app: HomeApp,
  x: number,
  y: number,
  size: number,
): void {
  ctx.save();
  roundedRect(ctx, x, y, size, size, size * ICON_RADIUS);
  ctx.clip();

  ctx.fillStyle = app.accent;
  ctx.fillRect(x, y, size, size);

  const gloss = ctx.createLinearGradient(x, y, x, y + size);
  gloss.addColorStop(0, GLOSS_TOP);
  gloss.addColorStop(GLOSS_BREAK, GLOSS_NONE);
  gloss.addColorStop(1, GLOSS_FOOT);
  ctx.fillStyle = gloss;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = GLYPH_INK;
  ctx.font = `700 ${(size * 0.42).toFixed(2)}px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(monogram(app.label), x + size / 2, y + size * 0.53);

  ctx.restore();
}

/** Initials, up to two: "Case studies" is CS and "Now" is N. Whole words never fit a tile. */
export function monogram(label: string): string {
  return label
    .split(/[\s·/-]+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase("en-US") ?? "")
    .join("");
}

/** The name under a tile, elided to the width its column allows rather than run into it. */
export function paintLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  center: number,
  y: number,
  size: number,
  maxWidth: number,
): void {
  ctx.fillStyle = LABEL_INK;
  ctx.font = `${size.toFixed(2)}px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(fit(ctx, label, maxWidth), center, y);
}

/**
 * The four bars, the three arcs and the cell — the right-hand end of the status bar. Every
 * measurement is a multiple of `unit`, because a status bar is physically the same size on a
 * phone and on a tablet and so is a fraction of neither one's width.
 */
export function paintIndicators(
  ctx: CanvasRenderingContext2D,
  right: number,
  y: number,
  unit: number,
): void {
  ctx.fillStyle = INK;
  const batteryWidth = unit * 6.4;
  const batteryHeight = unit * 3;
  const batteryX = right - batteryWidth;
  ctx.globalAlpha = 0.45;
  roundedRect(ctx, batteryX, y - batteryHeight / 2, batteryWidth, batteryHeight, unit);
  ctx.fill();
  ctx.globalAlpha = 1;
  roundedRect(
    ctx,
    batteryX + unit * 0.5,
    y - batteryHeight / 2 + unit * 0.5,
    (batteryWidth - unit) * 0.72,
    batteryHeight - unit,
    unit * 0.7,
  );
  ctx.fill();
  // The cap on the positive end, which is most of what makes a capsule read as a battery.
  roundedRect(ctx, right + unit * 0.3, y - unit * 0.7, unit * 0.7, unit * 1.4, unit * 0.35);
  ctx.fill();

  const wifiRight = batteryX - unit * 2.2;
  ctx.strokeStyle = INK;
  ctx.lineWidth = unit * 0.62;
  ctx.lineCap = "round";
  for (const reach of [1, 1.9, 2.8]) {
    ctx.beginPath();
    ctx.arc(wifiRight - unit * 2.2, y + unit * 1.3, unit * reach, TAU * 0.62, TAU * 0.88);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(wifiRight - unit * 2.2, y + unit * 1.2, unit * 0.36, 0, TAU);
  ctx.fill();

  const barsRight = wifiRight - unit * 5.6;
  for (let bar = 0; bar < 4; bar += 1) {
    const height = unit * (1.1 + bar * 0.62);
    roundedRect(
      ctx,
      barsRight - (3 - bar) * unit * 1.3,
      y + unit * 1.5 - height,
      unit * 0.85,
      height,
      unit * 0.28,
    );
    ctx.fill();
  }
}

/** The bar the device is dismissed by, centered on the bottom edge of the display. */
export function paintHomeBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bottom: number,
): void {
  const { width: W, height: H } = ctx.canvas;

  ctx.fillStyle = INK;
  roundedRect(ctx, (W - width) / 2, H - bottom - height, width, height, height / 2);
  ctx.fill();
}

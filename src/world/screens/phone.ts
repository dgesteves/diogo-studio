"use client";

import { useEffect, useState } from "react";
import { type CanvasTexture } from "three";
import { siteConfig } from "@/content/profile";
import { fit, INK, MONO } from "./kit";
import { useScreenTexture } from "./texture";

/**
 * The phone's home screen: a status bar, a grid of app icons and a dock, painted from the
 * station list so that the object lying on the desk is a legend for the room around it —
 * every neon in here is an app on there, in the same color the sign above it is lit.
 *
 * It is not built out of `kit.ts` the way the monitors and the wall panels are, and that is
 * the point of it being its own file: those are one machine's screens, drawn on a backdrop
 * with scanlines and a rule under a header. A phone is a different device, so it has a
 * different chrome — no scanlines, no header, rounded artwork on a wallpaper — and sharing
 * the room's ground would make it read as another panel of the same console.
 *
 * What it does share is the typeface. Every glyph in this room is the one mono stack, and a
 * phone set in a UI sans would be the only object in it speaking a second language.
 *
 * Nothing here is a fact. The apps arrive as label and accent, the clock arrives formatted,
 * and this routine decides the grid, the monogram, the truncation and the paint.
 */

/** One app on the home screen: what it is called, and the color its station is lit with. */
export type PhoneApp = {
  readonly label: string;
  readonly accent: string;
};

export type PhoneHomeView = {
  /** In reading order. The first four are docked; the rest fill the grid, and any that do
   * not fit are dropped — a home screen shows what a home screen holds. */
  readonly apps: readonly PhoneApp[];
  /** Both already formatted, because the zone the studio keeps is a fact and this is a draw. */
  readonly clock: string;
  readonly date: string;
};

/**
 * 384 px across the 7.29 cm of active display is ~5300 px/m — two and a half times the
 * tablet beside it, and not a luxury: phone UI is *small*, so the only way to lay this out
 * in the millimeters the real thing uses is to give the canvas the pixels those millimeters
 * need. The height is the modeled display's own ratio, so nothing is painted stretched;
 * `scene/phone.test.ts` holds the two together.
 */
export const PHONE_SCREEN = { width: 384, height: 834 } as const;

/**
 * The layout, in fractions of the screen's width — which is how a phone's own grid is
 * specified, and what keeps this design intact if the canvas is ever resized. The numbers
 * are the real ones: four columns of 60 pt icons with 44 pt between them inside a 30 pt
 * margin, which is what makes the block of artwork sit where the eye expects it.
 */
const MARGIN = 0.068;
const ICON = 0.141;
const COLUMN_PITCH = 0.241;
const ROW_PITCH = 0.245;
const COLUMNS = 4;
const ROWS = 4;

/**
 * The widget above the apps, and why there is one at all. A phone of this shape has room for
 * half as many apps again as the room has stations, so a grid started under the status bar
 * ends partway down and leaves the bottom of a lit panel empty — which reads as a screen that
 * failed to finish drawing rather than as a home screen. A card in the first two rows is what
 * a home screen with room to spare actually has on it, and it pushes the block of icons down
 * to where the dock catches it.
 */
const WIDGET = { top: 0.268, height: 0.33, radius: 0.072, pad: 0.05 } as const;
const WIDGET_CLOCK_SIZE = 0.15;
const WIDGET_DATE_SIZE = 0.032;
/** The date sits under the time rather than in the far corner: one block, read in one go. */
const WIDGET_DATE_DROP = 0.077;
const GRID_TOP = WIDGET.top + WIDGET.height + 0.085;
/** iOS rounds an icon at 22.6% of its side. Below about a fifth it stops reading as one. */
const ICON_RADIUS = 0.226;
const LABEL_SIZE = 0.025;
const LABEL_GAP = 0.03;
/** Wider than a tile and narrower than the pitch: a label may overhang, never collide. */
const LABEL_WIDTH = 0.21;

const DOCK_COUNT = 4;
const DOCK_INSET = 0.023;
const DOCK_HEIGHT = 0.218;
const DOCK_RADIUS = 0.095;
/** Measured up from the bottom edge of the display, like everything else in this band. */
const DOCK_BOTTOM = 0.072;
const HOME_BAR = { width: 0.32, height: 0.0115, bottom: 0.021 } as const;
const SEARCH = { width: 0.235, height: 0.062, gap: 0.055, size: 0.032 } as const;
const SEARCH_LABEL = "Search";

const ISLAND = { width: 0.284, height: 0.084, top: 0.026 } as const;
const STATUS_CLOCK = { x: 0.118, y: 0.068, size: 0.042 } as const;
const STATUS_Y = 0.068;

/**
 * The paint box. These are pigments, not surfaces: they never reach a material, so they live
 * with the routine that strikes them rather than in the room's surface list. The type is set
 * in the kit's ink, at the alphas this screen needs — a phone that wrote in a second white
 * would be the one screen in the room lit off a different bulb.
 *
 * The wallpaper is the room seen from inside the phone — near-black with the studio's cyan
 * pooling at the top, because a bright wallpaper under seventeen lit icons is a white slab
 * from across the desk and nothing else.
 */
const WALLPAPER_TOP = "#08131c";
const WALLPAPER_BOTTOM = "#02060a";
const WALLPAPER_GLOW = "rgba(34, 211, 238, 0.22)";

const LABEL_INK = "rgba(232, 246, 252, 0.88)";
/** The lit sheet the widget card, the dock tray and the search pill are all cut from. */
const TRAY_FILL = "rgba(232, 246, 252, 0.10)";
const TRAY_EDGE = "rgba(232, 246, 252, 0.16)";
const SEARCH_INK = "rgba(232, 246, 252, 0.82)";
/** The cutout is a hole in the panel, so it is the one thing on this screen that is black. */
const CUTOUT = "#000000";
/** A monogram sits on a lit tile, so it is struck in the wallpaper rather than in ink. */
const GLYPH_INK = "#04080c";
const GLOSS_TOP = "rgba(255, 255, 255, 0.17)";
const GLOSS_NONE = "rgba(255, 255, 255, 0)";
const GLOSS_FOOT = "rgba(0, 0, 0, 0.42)";
/** Where the highlight has died out. Past about a fifth it stops being a catch of light and
 * starts bleaching the tile, and half of the room's accents are pale to begin with. */
const GLOSS_BREAK = 0.16;

const TAU = Math.PI * 2;

function roundedRect(
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
function paintWallpaper(ctx: CanvasRenderingContext2D): void {
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

/** The four bars, the three arcs and the cell — the right-hand end of the status bar. */
function paintIndicators(ctx: CanvasRenderingContext2D, right: number, y: number): void {
  const W = ctx.canvas.width;
  const unit = W * 0.011;

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

function paintStatusBar(ctx: CanvasRenderingContext2D, clock: string): void {
  const W = ctx.canvas.width;

  ctx.fillStyle = CUTOUT;
  roundedRect(
    ctx,
    (W - W * ISLAND.width) / 2,
    W * ISLAND.top,
    W * ISLAND.width,
    W * ISLAND.height,
    (W * ISLAND.height) / 2,
  );
  ctx.fill();

  ctx.fillStyle = INK;
  ctx.font = `600 ${(W * STATUS_CLOCK.size).toFixed(2)}px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(clock, W * STATUS_CLOCK.x, W * STATUS_CLOCK.y);

  paintIndicators(ctx, W * (1 - MARGIN), W * STATUS_Y);
}

/**
 * One tile: the station's own color, a gloss down it, and the initials of the page it opens.
 * The gloss is painted as white and black over the accent rather than as a second color
 * derived from it — a draw routine has no business doing color math, and a lit tile that
 * catches the light at the top is the same picture either way.
 */
function paintIcon(
  ctx: CanvasRenderingContext2D,
  app: PhoneApp,
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

function paintLabel(ctx: CanvasRenderingContext2D, label: string, center: number, y: number): void {
  const W = ctx.canvas.width;

  ctx.fillStyle = LABEL_INK;
  ctx.font = `${(W * LABEL_SIZE).toFixed(2)}px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(fit(ctx, label, W * LABEL_WIDTH), center, y);
}

/**
 * The card: the studio's own clock, set large. It is the same minute the status bar shows and
 * the same one the terminal on the center monitor keeps, which is what a clock widget on a
 * real phone does — and the only thing this screen can enlarge without inventing something to
 * put in it.
 */
function paintWidget(ctx: CanvasRenderingContext2D, clock: string, date: string): void {
  const W = ctx.canvas.width;
  const top = W * WIDGET.top;
  const left = W * MARGIN;

  ctx.fillStyle = TRAY_FILL;
  ctx.strokeStyle = TRAY_EDGE;
  ctx.lineWidth = Math.max(1, W * 0.0035);
  roundedRect(ctx, left, top, W * (1 - MARGIN * 2), W * WIDGET.height, W * WIDGET.radius);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `700 ${(W * WIDGET_CLOCK_SIZE).toFixed(2)}px ${MONO}`;
  ctx.fillText(clock, left + W * WIDGET.pad, top + W * (WIDGET.pad + WIDGET_CLOCK_SIZE));

  ctx.fillStyle = LABEL_INK;
  ctx.font = `${(W * WIDGET_DATE_SIZE).toFixed(2)}px ${MONO}`;
  ctx.fillText(
    date,
    left + W * WIDGET.pad,
    top + W * (WIDGET.pad + WIDGET_CLOCK_SIZE + WIDGET_DATE_DROP),
  );
}

function paintGrid(ctx: CanvasRenderingContext2D, apps: readonly PhoneApp[]): void {
  const W = ctx.canvas.width;
  const size = W * ICON;

  apps.forEach((app, index) => {
    const x = W * (MARGIN + (index % COLUMNS) * COLUMN_PITCH);
    const y = W * (GRID_TOP + Math.floor(index / COLUMNS) * ROW_PITCH);

    paintIcon(ctx, app, x, y, size);
    paintLabel(ctx, app.label, x + size / 2, y + size + W * LABEL_GAP);
  });
}

/**
 * The dock, and the search pill that rides above it — one function because the pill is placed
 * off the tray's top edge rather than off the screen's bottom.
 *
 * The tray is a lit sheet rather than a blur. A real one is the wallpaper behind it out of
 * focus, and there is nothing back there to blur: the wallpaper under it is a flat near-black,
 * so the frosting would be invisible and the tray would lose its edge.
 */
function paintDock(ctx: CanvasRenderingContext2D, apps: readonly PhoneApp[]): void {
  const { width: W, height: H } = ctx.canvas;
  const height = W * DOCK_HEIGHT;
  const top = H - W * DOCK_BOTTOM - height;
  const size = W * ICON;

  ctx.fillStyle = TRAY_FILL;
  ctx.strokeStyle = TRAY_EDGE;
  ctx.lineWidth = Math.max(1, W * 0.0035);
  roundedRect(ctx, W * DOCK_INSET, top, W * (1 - DOCK_INSET * 2), height, W * DOCK_RADIUS);
  ctx.fill();
  ctx.stroke();

  apps.forEach((app, index) => {
    paintIcon(ctx, app, W * (MARGIN + index * COLUMN_PITCH), top + (height - size) / 2, size);
  });

  paintSearch(ctx, top - W * SEARCH.gap);
}

/**
 * The pill above the dock. It stands where the page dots would be, and it is a pill rather
 * than dots because this home screen is one page — a row of dots would claim a second one.
 */
function paintSearch(ctx: CanvasRenderingContext2D, bottom: number): void {
  const W = ctx.canvas.width;
  const width = W * SEARCH.width;
  const height = W * SEARCH.height;
  const left = (W - width) / 2;
  const middle = bottom - height / 2;

  ctx.fillStyle = TRAY_FILL;
  roundedRect(ctx, left, bottom - height, width, height, height / 2);
  ctx.fill();

  // The magnifier: a ring and the handle running out of it at the usual diagonal.
  const lens = height * 0.19;
  const lensX = left + width * 0.26;
  ctx.strokeStyle = SEARCH_INK;
  ctx.lineWidth = Math.max(1, height * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(lensX, middle - lens * 0.25, lens, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lensX + lens * 0.7, middle + lens * 0.45);
  ctx.lineTo(lensX + lens * 1.5, middle + lens * 1.25);
  ctx.stroke();

  ctx.fillStyle = SEARCH_INK;
  ctx.font = `${(W * SEARCH.size).toFixed(2)}px ${MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(SEARCH_LABEL, lensX + lens * 2.2, middle);
}

function paintHomeBar(ctx: CanvasRenderingContext2D): void {
  const { width: W, height: H } = ctx.canvas;
  const width = W * HOME_BAR.width;
  const height = W * HOME_BAR.height;

  ctx.fillStyle = INK;
  roundedRect(ctx, (W - width) / 2, H - W * HOME_BAR.bottom - height, width, height, height / 2);
  ctx.fill();
}

export function drawPhoneHome(ctx: CanvasRenderingContext2D, view: PhoneHomeView): void {
  paintWallpaper(ctx);
  paintStatusBar(ctx, view.clock);
  paintWidget(ctx, view.clock, view.date);
  paintDock(ctx, view.apps.slice(0, DOCK_COUNT));
  paintGrid(ctx, view.apps.slice(DOCK_COUNT, DOCK_COUNT + COLUMNS * ROWS));
  paintHomeBar(ctx);
}

/**
 * The studio's own clock, to the minute — the same one the terminal on the center monitor
 * keeps, because two clocks in one room disagreeing is a defect rather than a detail.
 */
const STUDIO_CLOCK = new Intl.DateTimeFormat("en-US", {
  timeZone: siteConfig.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const STUDIO_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: siteConfig.timeZone,
  weekday: "long",
  month: "long",
  day: "numeric",
});

/**
 * Checked twice a minute, and the check is what decides whether anything is repainted: a tick
 * landing inside the minute already drawn returns the timestamp it was given, which is the
 * same value, which is where React stops. A phone shows no seconds, and this is well over a
 * megabyte of texture — re-uploading it every second to redraw four glyphs that did not move
 * would be the whole cost of the object for none of its picture.
 */
const TICK_MS = 30_000;

export function usePhoneScreenTexture(apps: readonly PhoneApp[]): CanvasTexture {
  const { texture, paint } = useScreenTexture(PHONE_SCREEN.width, PHONE_SCREEN.height, {
    // The one screen in the room painted far denser than it renders: 5300 px/m of home
    // screen lands on 7 cm of desk seen from across it, and the top level alone turns the
    // grid of icons into a sparkle every time the camera moves.
    mipmapped: true,
  });
  const [minute, setMinute] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      // The minute is the state, so a tick inside the one already drawn stops here rather
      // than at a canvas: `set` on an unchanged string is what React bails out of.
      setMinute((last) =>
        STUDIO_CLOCK.format(last) === STUDIO_CLOCK.format(Date.now()) ? last : Date.now(),
      );
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    paint((ctx) =>
      drawPhoneHome(ctx, {
        apps,
        clock: STUDIO_CLOCK.format(minute),
        date: STUDIO_DATE.format(minute),
      }),
    );
  }, [paint, apps, minute]);

  return texture;
}

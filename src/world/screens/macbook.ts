"use client";

import { useEffect } from "react";
import { type CanvasTexture } from "three";
import { LABEL_INK, paintIcon, paintLabel, paintTray, paintWallpaper, type HomeApp } from "./home";
import { fit, MONO, SOFT } from "./kit";
import { useStudioMinute } from "./studio-time";
import { useScreenTexture } from "./texture";

/**
 * What is on the laptop in the lounge: a desktop, not a home screen. It is the third device
 * in the room showing the same set of stations the phone and the iPad show, and the point of
 * it is that a desktop is a *different* machine — a menu bar it shares the top of the screen
 * with a notch, one window standing open on a wallpaper, and a dock at the foot. Give this
 * panel the tablet's grid and the room has three copies of one picture in it.
 *
 * **The chrome is drawn at twice its real size.** 864 px stands for 1728 points of desktop,
 * so a 13 pt menu would be six pixels here and a title bar would be a smear. Everything the
 * eye uses to recognize a desktop is therefore scaled to stay legible on a 34 cm panel seen
 * from the far side of a room, and the layout is proportional rather than measured.
 *
 * Nothing here is a fact. The stations arrive as label and accent and the clock arrives
 * formatted; this routine decides the layout, the truncation and the paint.
 */

export type MacbookDesktopView = {
  /** In reading order: the sidebar lists them all, the pane shows what its grid holds, and
   *  the dock takes the first few. */
  readonly apps: readonly HomeApp[];
  /** Both formatted already — the zone the studio keeps is a fact, and this is a draw. */
  readonly clock: string;
  readonly date: string;
};

/**
 * 864 × 558 is the panel's own 3456 × 2234 quartered, so nothing is painted stretched;
 * `scene/macbook.test.ts` holds the canvas and the modeled display together.
 */
export const MACBOOK_SCREEN = { width: 864, height: 558 } as const;

/**
 * The paint box. Pigments, not surfaces: they never reach a material, so they live with the
 * routine that strikes them. The window is a lit sheet over the wallpaper in the same ink the
 * phone's trays are cut from, and the three buttons are the room's own signals rather than a
 * traffic light — every other lamp in here is cyan, magenta or green, and a red dot on the
 * one desktop would be the single warm thing in the room.
 */
const CHROME = "rgba(232, 246, 252, 0.07)";
const CHROME_EDGE = "rgba(232, 246, 252, 0.14)";
const SIDEBAR_FILL = "rgba(232, 246, 252, 0.05)";
const TITLE_BAR = "rgba(232, 246, 252, 0.06)";
const NOTCH_BLACK = "#000000";
const BUTTONS = ["#f472b6", "#fcd34d", "#34d399"] as const;

/** Chrome copy: the words a desktop has rather than anything it is showing. */
const MENUS = "studio   file   edit   view   window";
const WINDOW_TITLE = "explore";

/**
 * The layout, in fractions of the screen's **width** — the vertical measurements included, so
 * the design is one set of proportions instead of two that drift if the canvas is resized.
 */
const MENU = { height: 0.03, pad: 0.017, text: 0.0155 } as const;
const NOTCH = { width: 0.0914, height: 0.0243, radius: 0.009 } as const;
const WINDOW = {
  x: 0.145,
  y: 0.102,
  width: 0.71,
  height: 0.412,
  radius: 0.014,
  bar: 0.039,
} as const;
const BUTTON = { radius: 0.0065, pitch: 0.021, inset: 0.024 } as const;
const SIDEBAR = { width: 0.15, row: 0.035, dot: 0.0075, text: 0.0145, pad: 0.018 } as const;
const GRID = { columns: 4, rows: 2, icon: 0.072, pitch: 0.115, label: 0.014 } as const;
const DOCK = {
  height: 0.076,
  bottom: 0.013,
  icon: 0.058,
  gap: 0.014,
  inset: 0.27,
  radius: 0.018,
  count: 6,
} as const;

function paintMenuBar(ctx: CanvasRenderingContext2D, view: MacbookDesktopView): void {
  const W = ctx.canvas.width;
  const height = W * MENU.height;
  const pad = W * MENU.pad;
  const middle = height / 2;

  ctx.fillStyle = CHROME;
  ctx.fillRect(0, 0, W, height);

  ctx.font = `${(W * MENU.text).toFixed(2)}px ${MONO}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = LABEL_INK;
  ctx.fillText(MENUS, pad, middle);

  ctx.textAlign = "right";
  ctx.fillStyle = SOFT;
  ctx.fillText(`${view.date}   ${view.clock}`, W - pad, middle);
}

/**
 * The camera housing, and the one feature that says *this* laptop rather than any laptop. It
 * is a piece the panel does not have rather than something drawn on it, so it is painted last
 * of the top strip: the menu bar runs edge to edge underneath and this covers its middle.
 */
function paintNotch(ctx: CanvasRenderingContext2D): void {
  const W = ctx.canvas.width;
  const width = W * NOTCH.width;
  const height = W * NOTCH.height;
  const radius = W * NOTCH.radius;

  ctx.fillStyle = NOTCH_BLACK;
  ctx.beginPath();
  ctx.roundRect((W - width) / 2, 0, width, height, [0, 0, radius, radius]);
  ctx.fill();
}

type Frame = { x: number; y: number; width: number; height: number };

function paintWindowChrome(ctx: CanvasRenderingContext2D, frame: Frame, bar: number): void {
  const W = ctx.canvas.width;

  ctx.fillStyle = CHROME;
  ctx.strokeStyle = CHROME_EDGE;
  ctx.lineWidth = Math.max(1, W * 0.0014);
  ctx.beginPath();
  ctx.roundRect(frame.x, frame.y, frame.width, frame.height, W * WINDOW.radius);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(frame.x, frame.y, frame.width, frame.height, W * WINDOW.radius);
  ctx.clip();
  ctx.fillStyle = TITLE_BAR;
  ctx.fillRect(frame.x, frame.y, frame.width, bar);
  ctx.fillStyle = SIDEBAR_FILL;
  ctx.fillRect(frame.x, frame.y + bar, W * SIDEBAR.width, frame.height - bar);
  ctx.restore();

  BUTTONS.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      frame.x + W * BUTTON.inset + index * W * BUTTON.pitch,
      frame.y + bar / 2,
      W * BUTTON.radius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });

  ctx.fillStyle = SOFT;
  ctx.font = `${(W * SIDEBAR.text).toFixed(2)}px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(WINDOW_TITLE, frame.x + frame.width / 2, frame.y + bar / 2);
}

/** The station list down the side, each row a lit dot in its own accent and its name. */
function paintSidebar(
  ctx: CanvasRenderingContext2D,
  apps: readonly HomeApp[],
  frame: Frame,
  bar: number,
): void {
  const W = ctx.canvas.width;
  const pad = W * SIDEBAR.pad;
  const row = W * SIDEBAR.row;
  const left = frame.x + pad;
  const width = W * SIDEBAR.width;
  const rows = Math.floor((frame.height - bar - pad) / row);

  ctx.font = `${(W * SIDEBAR.text).toFixed(2)}px ${MONO}`;
  ctx.textBaseline = "middle";

  apps.slice(0, rows).forEach((app, index) => {
    const middle = frame.y + bar + pad + row * (index + 0.5);

    ctx.fillStyle = app.accent;
    ctx.beginPath();
    ctx.arc(left + W * SIDEBAR.dot, middle, W * SIDEBAR.dot, 0, Math.PI * 2);
    ctx.fill();

    const textX = left + W * SIDEBAR.dot * 3.4;
    ctx.textAlign = "left";
    ctx.fillStyle = LABEL_INK;
    ctx.fillText(fit(ctx, app.label, frame.x + width - pad - textX), textX, middle);
  });
}

/** The pane the window is open on: the same stations again, as artwork rather than a list. */
function paintGrid(
  ctx: CanvasRenderingContext2D,
  apps: readonly HomeApp[],
  frame: Frame,
  bar: number,
): void {
  const W = ctx.canvas.width;
  const paneX = frame.x + W * SIDEBAR.width;
  const paneWidth = frame.width - W * SIDEBAR.width;
  const icon = W * GRID.icon;
  const pitch = W * GRID.pitch;
  const columns = Math.min(GRID.columns, apps.length);
  const rows = Math.ceil(apps.length / GRID.columns);
  const column = paneWidth / (columns + 1);
  const block = (rows - 1) * pitch + icon + W * GRID.label * 2;
  const top = frame.y + bar + (frame.height - bar - block) / 2;

  apps.forEach((app, index) => {
    const center = paneX + column * ((index % GRID.columns) + 1);
    const y = top + Math.floor(index / GRID.columns) * pitch;

    paintIcon(ctx, app, center - icon / 2, y, icon);
    paintLabel(ctx, app.label, center, y + icon + W * 0.006, W * GRID.label, column * 0.92);
  });
}

function paintDock(ctx: CanvasRenderingContext2D, apps: readonly HomeApp[]): void {
  const { width: W, height: H } = ctx.canvas;
  const height = W * DOCK.height;
  const top = H - W * DOCK.bottom - height;
  const size = W * DOCK.icon;
  const span = apps.length * size + (apps.length - 1) * W * DOCK.gap;

  paintTray(ctx, W * DOCK.inset, top, W * (1 - DOCK.inset * 2), height, W * DOCK.radius);

  apps.forEach((app, index) => {
    const x = (W - span) / 2 + index * (size + W * DOCK.gap);
    paintIcon(ctx, app, x, top + (height - size) / 2, size);
  });
}

export function drawMacbookDesktop(ctx: CanvasRenderingContext2D, view: MacbookDesktopView): void {
  const W = ctx.canvas.width;
  const frame: Frame = {
    x: W * WINDOW.x,
    y: W * WINDOW.y,
    width: W * WINDOW.width,
    height: W * WINDOW.height,
  };
  const bar = W * WINDOW.bar;

  paintWallpaper(ctx);
  paintMenuBar(ctx, view);
  paintNotch(ctx);
  paintWindowChrome(ctx, frame, bar);
  paintSidebar(ctx, view.apps, frame, bar);
  paintGrid(ctx, view.apps.slice(0, GRID.columns * GRID.rows), frame, bar);
  paintDock(ctx, view.apps.slice(0, DOCK.count));
}

export function useMacbookScreenTexture(apps: readonly HomeApp[]): CanvasTexture {
  const { texture, paint } = useScreenTexture(MACBOOK_SCREEN.width, MACBOOK_SCREEN.height, {
    // Mipmapped for the reason the two devices on the desk are: a desktop is a field of hard
    // edges, and sampled from the top level alone the dock sparkles on every camera move.
    mipmapped: true,
  });
  const { clock, date } = useStudioMinute();

  useEffect(() => {
    paint((ctx) => drawMacbookDesktop(ctx, { apps, clock, date }));
  }, [paint, apps, clock, date]);

  return texture;
}

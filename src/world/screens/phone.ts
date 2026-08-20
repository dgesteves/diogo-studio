"use client";

import { useEffect } from "react";
import { type CanvasTexture } from "three";
import {
  paintHomeBar,
  paintIcon,
  paintIndicators,
  paintLabel,
  paintTray,
  paintWallpaper,
  roundedRect,
  TAU,
  TRAY_FILL,
  LABEL_INK,
  type HomeApp,
} from "./home";
import { INK, MONO } from "./kit";
import { useStudioMinute } from "./studio-time";
import { useScreenTexture } from "./texture";

/**
 * The phone's home screen: a status bar, a clock card, a grid of app icons and a dock,
 * painted from the station list so that the object lying on the desk is a legend for the room
 * around it — every neon in here is an app on there, in the same color the sign above it is
 * lit. The tablet beside the keyboard shows the same room; `home.ts` is what they share and
 * this file is the phone's own layout.
 *
 * Nothing here is a fact. The apps arrive as label and accent, the clock arrives formatted,
 * and this routine decides the grid, the truncation and the paint.
 */

export type PhoneHomeView = {
  /** In reading order. The first four are docked; the rest fill the grid, and any that do
   * not fit are dropped — a home screen shows what a home screen holds. */
  readonly apps: readonly HomeApp[];
  /** Both already formatted, because the zone the studio keeps is a fact and this is a draw. */
  readonly clock: string;
  readonly date: string;
};

/**
 * 384 px across the 7.29 cm of active display is ~5300 px/m — half as dense again as the
 * tablet beside it, and not a luxury: phone UI is *small*, so the only way to lay this out
 * in the millimeters the real thing uses is to give the canvas the pixels those millimeters
 * need. The height is the modeled display's own ratio, so nothing is painted stretched;
 * `scene/slab.test.ts` holds the two together.
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
/** The status bar is physically the same size on both devices, so its parts are struck off a
 *  unit rather than off the width — see `paintIndicators`. */
const STATUS_UNIT = 0.011;

/** The cutout is a hole in the panel, so it is the one thing on this screen that is black. */
const CUTOUT = "#000000";
const SEARCH_INK = "rgba(232, 246, 252, 0.82)";

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

  paintIndicators(ctx, W * (1 - MARGIN), W * STATUS_Y, W * STATUS_UNIT);
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

  paintTray(ctx, left, top, W * (1 - MARGIN * 2), W * WIDGET.height, W * WIDGET.radius);

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

function paintGrid(ctx: CanvasRenderingContext2D, apps: readonly HomeApp[]): void {
  const W = ctx.canvas.width;
  const size = W * ICON;

  apps.forEach((app, index) => {
    const x = W * (MARGIN + (index % COLUMNS) * COLUMN_PITCH);
    const y = W * (GRID_TOP + Math.floor(index / COLUMNS) * ROW_PITCH);

    paintIcon(ctx, app, x, y, size);
    paintLabel(
      ctx,
      app.label,
      x + size / 2,
      y + size + W * LABEL_GAP,
      W * LABEL_SIZE,
      W * LABEL_WIDTH,
    );
  });
}

/**
 * The dock, and the search pill that rides above it — one function because the pill is placed
 * off the tray's top edge rather than off the screen's bottom.
 */
function paintDock(ctx: CanvasRenderingContext2D, apps: readonly HomeApp[]): void {
  const { width: W, height: H } = ctx.canvas;
  const height = W * DOCK_HEIGHT;
  const top = H - W * DOCK_BOTTOM - height;
  const size = W * ICON;

  paintTray(ctx, W * DOCK_INSET, top, W * (1 - DOCK_INSET * 2), height, W * DOCK_RADIUS);

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

export function drawPhoneHome(ctx: CanvasRenderingContext2D, view: PhoneHomeView): void {
  const W = ctx.canvas.width;

  paintWallpaper(ctx);
  paintStatusBar(ctx, view.clock);
  paintWidget(ctx, view.clock, view.date);
  paintDock(ctx, view.apps.slice(0, DOCK_COUNT));
  paintGrid(ctx, view.apps.slice(DOCK_COUNT, DOCK_COUNT + COLUMNS * ROWS));
  paintHomeBar(ctx, W * HOME_BAR.width, W * HOME_BAR.height, W * HOME_BAR.bottom);
}

export function usePhoneScreenTexture(apps: readonly HomeApp[]): CanvasTexture {
  const { texture, paint } = useScreenTexture(PHONE_SCREEN.width, PHONE_SCREEN.height, {
    // The densest screen in the room by some way: 5300 px/m of home screen lands on 7 cm of
    // desk seen from across it, and the top level alone turns the grid of icons into a
    // sparkle every time the camera moves.
    mipmapped: true,
  });
  const { clock, date } = useStudioMinute();

  useEffect(() => {
    paint((ctx) => drawPhoneHome(ctx, { apps, clock, date }));
  }, [paint, apps, clock, date]);

  return texture;
}

"use client";

import { useEffect } from "react";
import { type CanvasTexture } from "three";
import { siteConfig } from "@/content/profile";
import {
  LABEL_INK,
  paintHomeBar,
  paintIcon,
  paintIndicators,
  paintLabel,
  paintTray,
  paintWallpaper,
  type HomeApp,
} from "./home";
import { INK, MONO } from "./kit";
import { useStudioMinute } from "./studio-time";
import { useScreenTexture } from "./texture";

/**
 * The tablet's home screen: a status bar, one wide clock card, three rows of app icons and a
 * dock — the same room the phone shows, laid out for a panel two and a half times the width.
 *
 * It is a *different* layout rather than the phone's scaled up, which is the whole reason the
 * two files exist beside `home.ts`. Five columns instead of four, a card that runs the width
 * of the screen instead of standing in the first two rows, and a dock set in from both edges
 * rather than filling them — put a phone's grid on this shape and it reads as a phone
 * screenshot blown up, which is exactly what a tablet does not look like.
 *
 * Nothing here is a fact. The apps arrive as label and accent, the clock, the date and the
 * city arrive formatted, and this routine decides the grid, the truncation and the paint.
 */

export type TabletHomeView = {
  /** In reading order. The first five are docked, the rest fill the grid, and any that fit
   * neither are dropped — a home screen shows what a home screen holds. */
  readonly apps: readonly HomeApp[];
  /** Formatted already: the zone the studio keeps is a fact, and this is a draw. */
  readonly clock: string;
  readonly date: string;
  /** The city that clock is set to, which is what makes the card a world clock. */
  readonly city: string;
};

/**
 * 540 px across the 16.06 cm of active display is ~3400 px/m — two thirds of the phone's
 * density beside it, and the right call for a screen that is twice the size on the desk and
 * therefore twice the pixels for the same picture. The height is the modeled display's own
 * ratio, so nothing is painted stretched; `scene/slab.test.ts` holds the two together.
 */
export const TABLET_SCREEN = { width: 540, height: 783 } as const;

/**
 * The layout, in fractions of the screen's **width** — including the vertical ones, so the
 * design is one set of proportions rather than two that drift when the canvas is resized.
 */
const MARGIN = 0.06;
const ICON = 0.14;
const COLUMNS = 5;
const ROWS = 3;
const COLUMN_PITCH = (1 - MARGIN * 2 - ICON) / (COLUMNS - 1);
const ROW_PITCH = 0.235;
const GRID_TOP = 0.45;
const LABEL_SIZE = 0.026;
const LABEL_GAP = 0.028;
/** Wider than a tile and narrower than the pitch: a label may overhang, never collide. */
const LABEL_WIDTH = 0.175;

/**
 * The card, and why it is a world clock rather than the phone's. Both devices are lit by the
 * same minute — two clocks in one room disagreeing is a defect — so the tablet earns nothing
 * by repeating the phone's card at a larger size. Naming the city the time belongs to is what
 * the extra width is actually good for, and it is the one thing a screen in this room can say
 * about where it is standing.
 */
const CARD = { top: 0.1, height: 0.27, radius: 0.05, pad: 0.045 } as const;
const CARD_CLOCK_SIZE = 0.125;
const CARD_DATE_SIZE = 0.028;
/** The date sits under the time rather than in the far corner: one block, read in one go. */
const CARD_DATE_DROP = 0.05;
const CARD_CITY_SIZE = 0.032;

/**
 * The dock: a pill, inset from both edges and standing clear of the bottom. A tablet's dock
 * does not reach the sides of the display the way a phone's does, and that gap is most of
 * what tells the two devices apart in one glance.
 */
const DOCK = {
  count: 5,
  /** All but a hair of the grid's tile: a docked app is the same app, at the same size. */
  icon: 0.13,
  gap: 0.045,
  inset: 0.03,
  height: 0.19,
  bottom: 0.055,
} as const;
const DOCK_RADIUS = 0.06;

const STATUS = { clockSize: 0.032, y: 0.05, unit: 0.0075 } as const;
const HOME_BAR = { width: 0.24, height: 0.009, bottom: 0.02 } as const;

function paintStatusBar(ctx: CanvasRenderingContext2D, clock: string): void {
  const W = ctx.canvas.width;

  ctx.fillStyle = INK;
  ctx.font = `600 ${(W * STATUS.clockSize).toFixed(2)}px ${MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(clock, W * MARGIN, W * STATUS.y);

  paintIndicators(ctx, W * (1 - MARGIN), W * STATUS.y, W * STATUS.unit);
}

function paintCard(ctx: CanvasRenderingContext2D, view: TabletHomeView): void {
  const W = ctx.canvas.width;
  const top = W * CARD.top;
  const left = W * MARGIN;
  const right = W * (1 - MARGIN);

  paintTray(ctx, left, top, right - left, W * CARD.height, W * CARD.radius);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `700 ${(W * CARD_CLOCK_SIZE).toFixed(2)}px ${MONO}`;
  ctx.fillText(view.clock, left + W * CARD.pad, top + W * (CARD.pad + CARD_CLOCK_SIZE));

  ctx.fillStyle = LABEL_INK;
  ctx.font = `${(W * CARD_DATE_SIZE).toFixed(2)}px ${MONO}`;
  ctx.fillText(
    view.date,
    left + W * CARD.pad,
    top + W * (CARD.pad + CARD_CLOCK_SIZE + CARD_DATE_DROP),
  );

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.font = `${(W * CARD_CITY_SIZE).toFixed(2)}px ${MONO}`;
  ctx.fillText(view.city, right - W * CARD.pad, top + W * CARD.pad);
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

/** The docked apps are wordless — a docked app is known by its tile, on both devices. */
function paintDock(ctx: CanvasRenderingContext2D, apps: readonly HomeApp[]): void {
  const { width: W, height: H } = ctx.canvas;
  const height = W * DOCK.height;
  const top = H - W * DOCK.bottom - height;
  const size = W * DOCK.icon;
  const span = apps.length * size + (apps.length - 1) * W * DOCK.gap;

  paintTray(ctx, W * DOCK.inset, top, W * (1 - DOCK.inset * 2), height, W * DOCK_RADIUS);

  apps.forEach((app, index) => {
    const x = (W - span) / 2 + index * (size + W * DOCK.gap);
    paintIcon(ctx, app, x, top + (height - size) / 2, size);
  });
}

export function drawTabletHome(ctx: CanvasRenderingContext2D, view: TabletHomeView): void {
  const W = ctx.canvas.width;

  paintWallpaper(ctx);
  paintStatusBar(ctx, view.clock);
  paintCard(ctx, view);
  paintDock(ctx, view.apps.slice(0, DOCK.count));
  paintGrid(ctx, view.apps.slice(DOCK.count, DOCK.count + COLUMNS * ROWS));
  paintHomeBar(ctx, W * HOME_BAR.width, W * HOME_BAR.height, W * HOME_BAR.bottom);
}

export function useTabletScreenTexture(apps: readonly HomeApp[]): CanvasTexture {
  const { texture, paint } = useScreenTexture(TABLET_SCREEN.width, TABLET_SCREEN.height, {
    // Mipmapped for the same reason the phone's is: a home screen is a field of hard edges,
    // and sampled from the top level alone the grid of icons sparkles on every camera move.
    mipmapped: true,
  });
  const { clock, date } = useStudioMinute();

  useEffect(() => {
    paint((ctx) => drawTabletHome(ctx, { apps, clock, date, city: siteConfig.address.locality }));
  }, [paint, apps, clock, date]);

  return texture;
}

"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type CanvasTexture } from "three";
import { worldColors } from "../materials";
import { divider, fillScreen, INK, MONO, scanlines, SOFT } from "./kit";
import { useScreenTexture } from "./texture";

/**
 * The control deck's display: four channel meters over a row of soft keys, repainted on the
 * frame loop. It lives beside the desk monitors rather than in `monitors.ts` because it has
 * a different consumer (`scene/control-deck.tsx`), a different shape — half the width of a
 * monitor and read at arm's length rather than across the room — and a layout nothing else
 * draws.
 *
 * The panel is 17.6 cm of console face, so everything here is set larger and sparser than a
 * monitor's screen: four rows and four chips, no paragraph anywhere, and the numbers big
 * enough to read from the chair without leaning in.
 *
 * No fact lives here. The channels and the keys are the device's own legend — invented
 * chrome, like the editor's sample listing — and the levels arrive as a parameter.
 */

/** 512 × 336 is the console face's own 1.52 : 1, so the type is never painted stretched. */
export const CONTROL_SCREEN = { width: 512, height: 336 } as const;

export const CHANNELS = ["power", "uplink", "thermal", "signal"] as const;
export const KEYS = ["lights", "audio", "render", "scene"] as const;

/** The routine's pigments, which are paint rather than surfaces and so live with it. */
const LABEL = "rgba(125, 232, 200, 0.85)";
const TRACK = "rgba(232, 246, 252, 0.09)";
const CHIP = "rgba(232, 246, 252, 0.07)";
/** The lit chip is a lamp with a legend on it: its label has to go dark to stay readable. */
const CHIP_INK = "#03080c";

const MARGIN = 24;
const HEADER_Y = 22;
const RULE_Y = 66;
const METER_TOP = 88;
const METER_STEP = 44;
const METER_LABEL_X = MARGIN;
const TRACK_X = 100;
const TRACK_HEIGHT = 12;
const VALUE_WIDTH = 60;
const KEY_ROW_Y = 264;
const KEY_HEIGHT = 44;
const KEY_GAP = 12;
const KEY_RADIUS = 8;
/** Past this a channel reads as running hot, which is the only state the meter distinguishes. */
const HOT = 0.85;

export type ControlDeckView = {
  /** One per channel, in `CHANNELS` order. Out-of-range values are the draw's to clamp. */
  levels: readonly number[];
  /** Which key is lit, as an index into `KEYS`. */
  active: number;
};

/**
 * One channel: name, bar, number. The bar is clamped rather than trusted — a meter painted
 * past its track is the one failure here that still looks like a working screen — and it
 * keeps a stub of fill at zero so a dead channel reads as off rather than as missing.
 */
function drawMeter(ctx: CanvasRenderingContext2D, label: string, level: number, y: number): void {
  const W = ctx.canvas.width;
  const trackWidth = W - MARGIN - VALUE_WIDTH - TRACK_X;
  const value = Math.max(0, Math.min(1, level));

  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = LABEL;
  ctx.fillText(label, METER_LABEL_X, y);

  ctx.fillStyle = TRACK;
  ctx.beginPath();
  ctx.roundRect(TRACK_X, y + 2, trackWidth, TRACK_HEIGHT, TRACK_HEIGHT / 2);
  ctx.fill();

  ctx.fillStyle = value > HOT ? worldColors.accentBright : worldColors.accent;
  ctx.beginPath();
  ctx.roundRect(
    TRACK_X,
    y + 2,
    Math.max(TRACK_HEIGHT, value * trackWidth),
    TRACK_HEIGHT,
    TRACK_HEIGHT / 2,
  );
  ctx.fill();

  ctx.fillStyle = INK;
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(value * 100)}%`, W - MARGIN, y);
  ctx.textAlign = "left";
}

/** The soft keys, laid out to the same count and order as the physical row under the panel. */
function drawKeys(ctx: CanvasRenderingContext2D, active: number): void {
  const W = ctx.canvas.width;
  const width = (W - MARGIN * 2 - KEY_GAP * (KEYS.length - 1)) / KEYS.length;

  ctx.font = `16px ${MONO}`;
  KEYS.forEach((label, index) => {
    const x = MARGIN + index * (width + KEY_GAP);
    const lit = index === active;

    ctx.fillStyle = lit ? worldColors.accent : CHIP;
    ctx.beginPath();
    ctx.roundRect(x, KEY_ROW_Y, width, KEY_HEIGHT, KEY_RADIUS);
    ctx.fill();

    ctx.fillStyle = lit ? CHIP_INK : SOFT;
    ctx.textAlign = "center";
    ctx.fillText(label, x + width / 2, KEY_ROW_Y + KEY_HEIGHT / 2 - 8);
  });
  ctx.textAlign = "left";
}

export function drawControlDeck(ctx: CanvasRenderingContext2D, view: ControlDeckView): void {
  const W = ctx.canvas.width;

  fillScreen(ctx);
  scanlines(ctx);

  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = worldColors.accent;
  ctx.font = `bold 26px ${MONO}`;
  ctx.fillText("● CONTROL", MARGIN, HEADER_Y);

  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = SOFT;
  ctx.textAlign = "right";
  ctx.fillText("hub · linked", W - MARGIN, HEADER_Y + 10);
  ctx.textAlign = "left";

  divider(ctx, RULE_Y, { margin: MARGIN });

  CHANNELS.forEach((label, index) => {
    drawMeter(ctx, label, view.levels[index] ?? 0, METER_TOP + index * METER_STEP);
  });

  drawKeys(ctx, view.active);
}

/**
 * What the deck is doing at a moment, as a function of the clock alone: a sine per channel at
 * its own rate, and a key that steps along the row. Deterministic on purpose — the transcript
 * is snapshotted, and a screen this small is read as decoration rather than as data, so a
 * seeded walk would buy nothing a phase offset does not.
 *
 * Each band stays inside 0–1 on its own; the draw clamps anyway, because the two decisions
 * are separate and only one of them is visible when it is wrong.
 */
const CHANNEL_WAVES = [
  { base: 0.72, span: 0.2, rate: 0.55, phase: 0 },
  { base: 0.48, span: 0.34, rate: 1.4, phase: 1.7 },
  { base: 0.6, span: 0.26, rate: 0.9, phase: 3.1 },
  { base: 0.35, span: 0.3, rate: 2.2, phase: 5.2 },
] as const;

const KEY_SECONDS = 2.6;

export function controlDeckView(elapsed: number): ControlDeckView {
  return {
    levels: CHANNEL_WAVES.map(
      ({ base, span, rate, phase }) => base + span * Math.sin(elapsed * rate + phase),
    ),
    active: Math.floor(elapsed / KEY_SECONDS) % KEYS.length,
  };
}

/**
 * Twelve repaints a second: fast enough that the meters drift rather than step, slow enough
 * that a canvas upload is not on every frame. The first frame paints — the frozen quality
 * tier renders exactly one, and a blank panel is what a lazier initial value leaves there.
 */
const REDRAW_INTERVAL = 1 / 12;

export function useControlDeckTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(CONTROL_SCREEN.width, CONTROL_SCREEN.height);
  const elapsed = useRef(0);
  const sinceRedraw = useRef(REDRAW_INTERVAL);

  useFrame((_, delta) => {
    elapsed.current += delta;
    sinceRedraw.current += delta;
    if (sinceRedraw.current < REDRAW_INTERVAL) return;
    sinceRedraw.current = 0;

    paint((ctx) => drawControlDeck(ctx, controlDeckView(elapsed.current)));
  });

  return texture;
}

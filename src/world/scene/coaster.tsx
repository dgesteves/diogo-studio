"use client";

import { type ReactElement } from "react";
import { LinearMipmapLinearFilter, type CanvasTexture } from "three";
import { useDisposable } from "../gpu";
import { worldColors } from "../materials";
import { MONO } from "../screens/kit";
import { createCanvasTexture } from "../screens/texture";

/**
 * The coaster the mug stands on: a black slab with an etched face, lit from its own print
 * rather than from the room. It exists because the mug is the `/now` station's object and a
 * bone-white cylinder on a bare desk had nothing under it to say the desk is *used* — and
 * because the one surface in the studio that is allowed to be loud is a face this small.
 *
 * The face is a canvas print, for the same reason the mug's is: an etched disc is rings,
 * ticks and a label, all of which are two-dimensional. It is drawn on a square canvas because
 * a `circleGeometry` maps its radius to half of one — the design is laid out in fractions of
 * that square and lands on the disc unstretched at any resolution.
 *
 * The mug covers everything inside 65% of the radius, so the print carries its detail in the
 * ring outside that and keeps the middle plain. The pigments are the routine's paint box, not
 * the room's surface list, and live here with it as `mug.tsx` and `books.tsx` do.
 */

/**
 * In meters. The radius is set by what has to be *seen*, not by what a mug needs to stand on:
 * the `/now` camera looks along the desk at about 17°, which flattens the face to under a
 * third of its height, so a ring of 1.8 cm around the cup came out as a bright hairline and
 * nothing else. At 6.8 cm the ring is 2.4 cm and the etching on it survives the angle.
 */
export const COASTER = { radius: 0.068, height: 0.009, segments: 64 } as const;

/** The print is inset so the slab's own edge stays visible as a bezel around it. */
const FACE_INSET = 0.0016;
const FACE_Y = COASTER.height + 0.00015;
/** A hairline of the print's magenta around the rim, so the slab's edge is lit from its face. */
const RIM = { tube: 0.0007, y: COASTER.height - 0.0009 } as const;

/**
 * 256 px across 13.6 cm is ~1900 px/m — about what the mug beside it is printed at, and what
 * the ticks need: a tick ring painted any coarser aliases into a dashed smear the moment the
 * camera is off-axis.
 */
export const COASTER_PRINT = { width: 256, height: 256 } as const;

/** What a coaster is for, in the room's voice. One line, because the band it sits in is 6 mm. */
export const COASTER_LABEL = "THERMAL SINK";

/**
 * The paint box, and the one place this object argues with the room. Everything else in the
 * studio is lit on the cyan accent or a shade of it, and a coaster in that palette is another
 * cyan ring on a desk that already has several — the mug stops reading as an object standing
 * on something and starts reading as one more lit edge.
 *
 * So the face is warm and pink: magenta for the rings, violet for the dial, and the amber the
 * `/now` station is accented with for the gauge and the type. The only cyan on it is none.
 * `HOT` is the room's token rather than a fourth literal, because the slab's rim is that same
 * color as a material and the two must not drift apart.
 */
const VOID = "#0a0510";
const ETCH = "#170b1f";
/** The gauge's spent segments: the pad's ink, lifted enough to read against it. */
const ETCH_LIGHT = "#301640";
const HOT = worldColors.hotNeon;
const VIOLET = "#b98cff";
const VIOLET_DIM = "rgba(185, 140, 255, 0.34)";
const AMBER = "#ffb01f";
const TAU = Math.PI * 2;

/**
 * Every radius is a fraction of the disc's own, so the layout survives a resize — and every
 * one of them is outside 0.65, which is where the mug's base lands. That number is the design
 * constraint on this face: anything etched inside it is etched under the cup.
 */
const RIM_RING = 0.955;
const TICK_OUTER = 0.95;
const TICK_INNER = 0.89;
const TICK_LONG = 0.85;
const GAUGE_RING = 0.8;
const PAD_RING = 0.76;
const TICKS = 48;
/** Every fourth tick is the long one, which is what makes the ring read as a dial. */
const TICK_MAJOR = 4;
/**
 * The arc of the ring the label is set in, as a share of the circle centered on the bottom of
 * the canvas — which is the edge of the disc that faces the room. No tick is drawn across it.
 */
const LABEL_ARC = 0.22;
const LABEL_RING = 0.8;
const LABEL_SIZE = 0.036;
const LABEL_TRACKING = 0.1;
const GAUGE_SEGMENTS = 7;
const GAUGE_LIT = 4;
/** Measured in turns from +x, clockwise on a canvas: 0.62 starts it left of top. */
const GAUGE_FROM = 0.62;
const GAUGE_ARC = 0.3;
/** Canvas angles run clockwise from +x, so a quarter turn is the bottom of the disc. */
const BOTTOM = 0.25;

function ring(ctx: CanvasRenderingContext2D, radius: number, style: string, width: number): void {
  const half = COASTER_PRINT.width / 2;
  ctx.strokeStyle = style;
  ctx.lineWidth = Math.max(1, half * width);
  ctx.beginPath();
  ctx.arc(half, half, half * radius, 0, TAU);
  ctx.stroke();
}

/** How far a turn is from the bottom of the disc, as a share of the circle: 0 to 0.5. */
function fromBottom(turn: number): number {
  const away = Math.abs(turn - BOTTOM) % 1;
  return Math.min(away, 1 - away);
}

/**
 * The dial. Ticks are drawn from the outside in so a long one grows towards the middle — the
 * outer edge is the slab's bezel, and a tick that crossed it would read as a chip — and the
 * band the label sits in is left empty rather than struck through.
 */
function paintTicks(ctx: CanvasRenderingContext2D): void {
  const half = COASTER_PRINT.width / 2;

  ctx.lineWidth = Math.max(1, half * 0.012);
  for (let index = 0; index < TICKS; index += 1) {
    const turn = index / TICKS;
    if (fromBottom(turn) < LABEL_ARC / 2) continue;

    const angle = turn * TAU;
    const major = index % TICK_MAJOR === 0;
    const inner = half * (major ? TICK_LONG : TICK_INNER);
    const outer = half * TICK_OUTER;

    ctx.strokeStyle = major ? VIOLET : VIOLET_DIM;
    ctx.beginPath();
    ctx.moveTo(half + Math.cos(angle) * outer, half + Math.sin(angle) * outer);
    ctx.lineTo(half + Math.cos(angle) * inner, half + Math.sin(angle) * inner);
    ctx.stroke();
  }
}

/**
 * The warmest thing on the face: a segmented arc, most of it lit, running over the top of the
 * disc where the mug's handle is not. Each segment is its own path, so the lit ones and the
 * spent ones are two colors of the same gauge rather than two shapes.
 */
function paintGauge(ctx: CanvasRenderingContext2D): void {
  const half = COASTER_PRINT.width / 2;
  const span = (TAU * GAUGE_ARC) / GAUGE_SEGMENTS;
  const gap = span * 0.28;

  ctx.lineWidth = Math.max(1, half * 0.036);
  ctx.lineCap = "butt";
  for (let index = 0; index < GAUGE_SEGMENTS; index += 1) {
    const start = TAU * GAUGE_FROM + index * span;
    ctx.strokeStyle = index < GAUGE_LIT ? AMBER : ETCH_LIGHT;
    ctx.beginPath();
    ctx.arc(half, half, half * GAUGE_RING, start, start + span - gap);
    ctx.stroke();
  }
}

/**
 * The whole face, painted once, and pure the way every draw routine in the room is: it takes
 * a context, reads nothing else and returns nothing.
 */
export function paintCoasterPrint(ctx: CanvasRenderingContext2D): void {
  const { width, height } = COASTER_PRINT;
  const half = width / 2;

  ctx.fillStyle = VOID;
  ctx.fillRect(0, 0, width, height);

  // The pad the mug lands on, a shade off the void so a sliver of it shows around the base.
  ctx.fillStyle = ETCH;
  ctx.beginPath();
  ctx.arc(half, half, half * PAD_RING, 0, TAU);
  ctx.fill();

  ring(ctx, RIM_RING, HOT, 0.02);
  // Bright, unlike the ticks: at the angle the room sees this face, the ring hugging the cup
  // is the part that reads, and a dim one reads as a scuff in the resin.
  ring(ctx, PAD_RING, HOT, 0.006);
  paintTicks(ctx);
  paintGauge(ctx);

  // Set at the bottom of the disc, in the gap left in the tick ring, where the mug's base does
  // not cover it and a camera looking down on the desk reads it upright.
  const size = height * LABEL_SIZE;
  ctx.fillStyle = AMBER;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${size.toFixed(2)}px ${MONO}`;
  ctx.letterSpacing = `${(size * LABEL_TRACKING).toFixed(2)}px`;
  ctx.fillText(COASTER_LABEL, half, half + half * LABEL_RING);
  ctx.letterSpacing = "0px";
}

function createCoasterPrintTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(COASTER_PRINT.width, COASTER_PRINT.height);

  // Painted once and then read at a glancing angle from across the room, like the mug's
  // print and unlike a screen — so it takes the mipmap chain `createCanvasTexture` leaves off.
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 4;

  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  paintCoasterPrint(ctx);
  texture.needsUpdate = true;
  return texture;
}

/** Cast resin: near-black, barely glossy, and no metal — a mug slides on a polished one. */
const SLAB = { color: "#080c11", roughness: 0.42, metalness: 0.1 } as const;

/**
 * The face is unlit on purpose. A `meshStandardMaterial` would hand this print to the room's
 * night rig, which is one dim key light and a lot of fog, and the etching would go the way the
 * mug's glaze did before it was lightened. Unlit and untone-mapped, the neon on it is the
 * value it was painted at, and the bloom pass treats it as the emitter it is meant to be.
 */
export function Coaster(): ReactElement {
  const print = useDisposable(() => createCoasterPrintTexture());

  return (
    <group>
      <mesh position={[0, COASTER.height / 2, 0]}>
        <cylinderGeometry
          args={[COASTER.radius, COASTER.radius - 0.0018, COASTER.height, COASTER.segments]}
        />
        <meshStandardMaterial {...SLAB} />
      </mesh>
      <mesh position={[0, FACE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[COASTER.radius - FACE_INSET, COASTER.segments]} />
        <meshBasicMaterial map={print} toneMapped={false} />
      </mesh>
      <mesh position={[0, RIM.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[COASTER.radius - RIM.tube, RIM.tube, 8, COASTER.segments]} />
        <meshBasicMaterial color={worldColors.hotNeon} toneMapped={false} />
      </mesh>
    </group>
  );
}

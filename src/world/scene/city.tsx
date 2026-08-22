"use client";

import { type ReactElement } from "react";
import {
  BackSide,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  RepeatWrapping,
  type CanvasTexture,
} from "three";
import { useDisposable } from "../gpu";
import { mulberry32 } from "../random";
import { frameMaterial, worldColors } from "../materials";
import { CITY_WINDOW, ROOM } from "../room";
import { createCanvasTexture } from "../screens/texture";

/**
 * What is outside the window: the frame itself and the city behind it.
 *
 * The skyline is modelled at **true scale, in the room's own meters**, rather than as a
 * diorama parked a few meters past the glass. A miniature is what the previous view was, and
 * it gives itself away the moment the camera moves: a tower two meters outside a window swings
 * across the frame as you cross the room, which nothing a mile away does. At true scale the
 * parallax is correct for free — the near towers drift, the far bank holds still — and the
 * window reads as a window rather than a lightbox. The room stands `STREET_Y` above the
 * street, high enough that no pavement is in shot and low enough that other roofs are.
 *
 * Four things carry it, and none of them is a draw call per building:
 *
 * - **Three cladding sheets, tiled.** Every tower samples one of three seamless facade sheets
 *   — a curtain wall, a punched masonry wall, a concrete ribbon slab — all scaled so a floor
 *   is `FLOOR_HEIGHT` on every building in the city, and read from a different place in the
 *   sheet by each tower, which is a UV offset rather than a texture apiece. One sheet is what
 *   made the last skyline read as one building repeated thirty times: the body tint multiplies
 *   a sheet that is nearly black to begin with, so tinting cannot separate two towers and only
 *   a different *rhythm* can.
 * - **One geometry per finish.** The three walls, the roofs, the crowns and the beacons merge
 *   into six buffers with the placement baked in — the pattern `scene/books.tsx` uses, and for
 *   the same reason: per-face UVs are what instancing cannot express. Nothing out here
 *   animates, so the transform an `InstancedMesh` would carry per copy is spent once at build
 *   time instead.
 * - **Facets and altitude, not shading.** The materials are unlit — a city at night is lit
 *   from inside, not by anything in this room — so the turn of a corner has to come from
 *   somewhere. Every vertex carries a color set from how squarely its face turns to the glass
 *   and from how high up the shaft it sits, the second because the murk a lit city sits in is
 *   *below* the viewer: without it a two-hundred-meter shaft is one flat value from street to
 *   crown, which is the last thing that reads as an extruded rectangle.
 * - **Depth as haze, not as fog.** The room's fog is 30 m deep and near-black; the city is
 *   600 m deep and washes *lighter* with distance, the way a lit atmosphere does. So the city
 *   opts out of the scene fog and buys its own: nested shells of horizon-colored haze that
 *   near towers sit inside of and far ones behind. Being spheres concentric with the backdrop,
 *   they hold the same gradient at every angle the window can be looked through.
 */

/**
 * The two figures the skyline is composed against, both measured from a camera standing back
 * from the glass. A tower is inside the reveal laterally within `IN_FRAME_SPREAD` × its
 * distance, and its top stays below the head of the window under `IN_FRAME_RISE` × its
 * distance. `city.test.ts` holds the table to both.
 */
export const IN_FRAME_SPREAD = 0.45;
export const IN_FRAME_RISE = 0.36;

/** Every distance out here is meters, the unit the room is already built in. */
export const FLOOR_HEIGHT = 3.9;

/**
 * How far the studio floor stands above the street — twenty-nine storeys, high in a tall
 * building rather than on top of one.
 *
 * The height is a composition decision, not a detail. From low down every neighbor's roof is
 * above the head of the window and the view is a wall of facade with no sky in it, which is
 * what the first pass of this was. From up here the skyline breaks the horizon instead of
 * burying it, the far bank reads against open sky, and the roofs of the shorter buildings come
 * into shot below — and a roof seen from above is the one cue that cannot be faked by a
 * backdrop. There is still nothing taller in frame than the towers that crop the reveal, so
 * the floor never reads as the summit.
 */
export const STREET_Y = -112;

/** The backdrop and the haze shells are concentric on the room, at standing eye height. */
const HORIZON_Y = 1.85;
const DOME_CENTER: [number, number, number] = [
  (ROOM.minX + ROOM.maxX) / 2,
  HORIZON_Y,
  (ROOM.minZ + ROOM.maxZ) / 2,
];
const DOME_RADIUS = 880;

const CITY_SEED = 20260822;

/**
 * The night sky over a metropolis, which is not a starfield: the light the city throws back at
 * its own air erases everything except the moon, and there is no moon in this one. What is left
 * is a vertical ramp — near-black overhead, a sodium-and-cyan wash where the ground glow piles
 * up against the horizon, and haze below it where the streets are lost.
 *
 * The stops are painted onto a sphere, so `v` is latitude and 0.5 is exactly the horizon.
 */
const SKY_STOPS = [
  [0.0, "#04060b"],
  [0.3, "#070c13"],
  [0.42, "#0e1a24"],
  [0.47, "#1e3040"],
  [0.492, "#3a4a51"],
  // The sodium line: the horizon of a lit city is warm and everything above it is not, and the
  // whole ramp used to be one blue-grey, which is a sky over open country rather than over
  // streets. It is a couple of degrees of latitude wide, so it reads as a line and not a wash.
  [0.5, "#5a5b52"],
  [0.508, "#44515a"],
  [0.53, "#26353f"],
  [0.58, "#14202a"],
  [0.7, "#0a1017"],
  [1.0, "#04070b"],
] as const;

/**
 * The haze: the same ramp again, carrying an alpha for how much air a sightline crosses. Three
 * shells of it stand between the viewer and the far bank, so a tower loses contrast with every
 * one it stands behind.
 *
 * The alpha peaks hard at the horizon and falls away **both** ways, which is the whole point of
 * it. It used to stay near-opaque all the way down to the nadir, on the reasoning that haze
 * pools low — but a viewer this high looks *through* that pool rather than along it, and three
 * shells at that density laid five parts in eight of flat haze over everything below the sill.
 * The canyon floor was behind it, and so was every street lit on it.
 */
const HAZE_STOPS = [
  [0.0, "rgba(10,17,24,0.08)"],
  [0.28, "rgba(14,21,28,0.18)"],
  [0.4, "rgba(22,33,41,0.46)"],
  [0.47, "rgba(52,64,70,0.86)"],
  // Carrying the same warmth the sky does, because these are the same air: haze that stayed
  // blue while the sky behind it turned warm made the far bank read as a separate picture.
  [0.5, "rgba(78,82,76,1)"],
  [0.54, "rgba(44,55,63,0.78)"],
  [0.62, "rgba(22,33,42,0.44)"],
  [0.75, "rgba(12,19,26,0.18)"],
  [1.0, "rgba(6,10,15,0.06)"],
] as const;

/**
 * The sky sheet. The haze only ever needs the ramp, so it stays a strip; the sky is wide
 * enough to carry weather, because a perfectly smooth gradient is the lightbox tell — a sky
 * with nothing in it is a backlit panel, and the eye finds that faster than it finds any
 * building. What goes on it is cloud lit from underneath, which is what a city's own glow
 * does to an overcast: pale along the bottom edge of a band and cold along the top.
 */
const SKY_TEXTURE_WIDTH = 384;
const HAZE_TEXTURE_WIDTH = 8;
const SKY_TEXTURE_HEIGHT = 512;

function paintVerticalRamp(
  stops: readonly (readonly [number, string])[],
  width: number,
  mipmapped: boolean,
): { ctx: CanvasRenderingContext2D | null; texture: CanvasTexture } {
  const { canvas, texture } = createCanvasTexture(width, SKY_TEXTURE_HEIGHT, { mipmapped });
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ctx, texture };

  // Canvas y runs down and texture v runs up, so the ramp is painted from the zenith.
  const gradient = ctx.createLinearGradient(0, 0, 0, SKY_TEXTURE_HEIGHT);
  for (const [offset, color] of stops) gradient.addColorStop(1 - offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, SKY_TEXTURE_HEIGHT);

  texture.needsUpdate = true;
  return { ctx, texture };
}

/**
 * The bands of cloud, drawn column by column so they wrap.
 *
 * A cloud on a sphere has to meet itself at u = 0, so the edge of a band is a sum of sines
 * whose periods divide the sheet exactly — no noise field, no seam to hide. Each column is
 * then one soft vertical gradient, which is what gives a band an underside and a top rather
 * than a hard rim.
 */
type CloudBand = {
  /** Latitude of the band's center, on the same 0..1 scale the ramp's stops use. */
  at: number;
  /** How deep the band is in that scale, and how far its edge wanders. */
  depth: number;
  drift: number;
  /** The lit underside and the cold top, and how strongly the band shows at all. */
  under: string;
  over: string;
  alpha: number;
};

const CLOUD_BANDS: readonly CloudBand[] = [
  { at: 0.548, depth: 0.05, drift: 0.016, under: "#6a6357", over: "#1b2831", alpha: 0.5 },
  { at: 0.605, depth: 0.075, drift: 0.028, under: "#43484c", over: "#111c26", alpha: 0.38 },
  { at: 0.7, depth: 0.1, drift: 0.036, under: "#2a3239", over: "#0a1017", alpha: 0.3 },
  { at: 0.515, depth: 0.022, drift: 0.008, under: "#8a7f68", over: "#3d4750", alpha: 0.42 },
  // Two bands well up the dome. A visitor at the glass can look almost straight up through it,
  // and everything above thirty degrees was open sky with nothing in it.
  { at: 0.79, depth: 0.13, drift: 0.05, under: "#1c242c", over: "#080e14", alpha: 0.34 },
  { at: 0.9, depth: 0.11, drift: 0.042, under: "#141b22", over: "#060b10", alpha: 0.26 },
];

function paintClouds(ctx: CanvasRenderingContext2D, rand: () => number): void {
  for (const band of CLOUD_BANDS) {
    const phase = [rand(), rand(), rand()].map((roll) => roll * Math.PI * 2);

    for (let x = 0; x < SKY_TEXTURE_WIDTH; x += 1) {
      const u = (x / SKY_TEXTURE_WIDTH) * Math.PI * 2;
      const wander =
        Math.sin(u + (phase[0] ?? 0)) * 0.5 +
        Math.sin(u * 3 + (phase[1] ?? 0)) * 0.32 +
        Math.sin(u * 7 + (phase[2] ?? 0)) * 0.18;
      const center = band.at + wander * band.drift;
      // Latitude 1 is the zenith and canvas y 0 is the top, so the two run opposite ways.
      const top = (1 - (center + band.depth / 2)) * SKY_TEXTURE_HEIGHT;
      const height = band.depth * SKY_TEXTURE_HEIGHT;

      const column = ctx.createLinearGradient(0, top, 0, top + height);
      column.addColorStop(0, "rgba(0,0,0,0)");
      column.addColorStop(0.45, band.over);
      column.addColorStop(0.82, band.under);
      column.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = band.alpha * (0.7 + 0.3 * (0.5 + 0.5 * wander));
      ctx.fillStyle = column;
      ctx.fillRect(x, top, 1, height);
    }
  }
  ctx.globalAlpha = 1;
}

export function createSkyTexture(): CanvasTexture {
  const { ctx, texture } = paintVerticalRamp(SKY_STOPS, SKY_TEXTURE_WIDTH, true);
  if (!ctx) return texture;
  paintClouds(ctx, mulberry32(CITY_SEED + 5));
  texture.needsUpdate = true;
  return texture;
}

export function createHazeTexture(): CanvasTexture {
  return paintVerticalRamp(HAZE_STOPS, HAZE_TEXTURE_WIDTH, false).texture;
}

/**
 * What the towers are clad in. Two sheets, because one is what made the last skyline read as
 * one building repeated: every tower in it was the same curtain wall at the same tone, and a
 * city is not built by one developer in one decade.
 *
 * Both tile seamlessly and both keep `FLOOR_HEIGHT` as their storey, so the two families line
 * up floor for floor across the view. What differs is the rhythm — a bay of glass is narrow
 * and continuous, a masonry pier is wide and the window inside it is a hole — and how they
 * light: an office lights by the floor plate, a residential or hotel block lights by the room.
 *
 * Each is painted once into a canvas and read by every tower wearing it, offset so no two
 * start at the same place in the sheet.
 */
const FACADE_FLOORS = 48;
const FLOOR_PX = 34;
const FACADE_HEIGHT = FACADE_FLOORS * FLOOR_PX;

/** The band of structure under each floor's glass, and the mullion between each pair of bays. */
const SPANDREL_PX = 11;
const MULLION_PX = 3;

const GLASS = "#0b1119";
/**
 * The spandrel used to sit within a couple of values of the glass, which meant an unlit floor
 * had no floor line in it at all: a dark tower was a flat panel with a few lit stripes printed
 * on, and the storeys only existed where somebody had left a light on. It is the horizontal
 * grain — the transom over each floor's head and the shadow under its sill — that says a
 * facade is storeys tall rather than a wall.
 */
const SPANDREL = "#151f29";
const SPANDREL_SHADOW = "#080d13";
const MULLION = "#22303d";
/** The cool line where a pane catches the sky. Hard-edged: a soft one reads as a smudge. */
const PANE_HIGHLIGHT = "rgba(120,160,185,0.5)";
const TRANSOM_HIGHLIGHT = "rgba(96,128,150,0.34)";

/**
 * Pigments the facade is painted with, not surface tokens: warm desk lamps, the neutral white
 * of a lit ceiling, the cold cast of a floor left on for the cleaners, and one cyan that ties
 * the city to the room it is seen from.
 */
const OFFICE_LIGHT = ["#ffdfaa", "#f3f7fb", "#c6dcef", "#86d6e8"] as const;

/** The warmer, softer set a lived-in room throws: lamps and screens, not ceiling grids. */
const ROOM_LIGHT = ["#ffcd8e", "#ffe6bd", "#e8d5b8", "#9fc4dd"] as const;

/**
 * What a ribbon floor lights in. The same office palette minus its cyan, because a ribbon run
 * is the full width of the slab: on a curtain wall the cyan lands on three bays and reads as
 * one late meeting room, and on a ribbon it lands on forty meters of continuous glazing and
 * reads as a lit tube taped to the building.
 */
const RIBBON_LIGHT = ["#ffdfaa", "#f3f7fb", "#c6dcef"] as const;

function pickRibbonLight(roll: number): string {
  if (roll < 0.46) return RIBBON_LIGHT[0];
  if (roll < 0.82) return RIBBON_LIGHT[1];
  return RIBBON_LIGHT[2];
}

function pickOfficeLight(roll: number): string {
  if (roll < 0.44) return OFFICE_LIGHT[0];
  if (roll < 0.78) return OFFICE_LIGHT[1];
  if (roll < 0.95) return OFFICE_LIGHT[2];
  return OFFICE_LIGHT[3];
}

function pickRoomLight(roll: number): string {
  if (roll < 0.5) return ROOM_LIGHT[0];
  if (roll < 0.8) return ROOM_LIGHT[1];
  if (roll < 0.94) return ROOM_LIGHT[2];
  return ROOM_LIGHT[3];
}

/**
 * A lit pane, painted as light in a room rather than as a filled rectangle.
 *
 * The flat fill is what made the last sheet read as stickers: a lit bay came out as one solid
 * pastel block, and a run of them as a painted stripe. What a lit floor actually shows through
 * glass is a gradient — the ceiling is the brightest thing in the room and the sill the
 * darkest — interrupted by whatever stands between the light and the window. So the pane gets
 * the ramp, a hard ceiling line at its head, and a few dark notches along the lower half for
 * the partitions and desks that break it up. None of the three is legible on its own at this
 * distance; together they are the difference between a window and a swatch.
 */
function paintLitPane(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  tint: string,
  x: number,
  y: number,
  width: number,
  height: number,
  strength: number,
): void {
  const ramp = ctx.createLinearGradient(0, y, 0, y + height);
  ramp.addColorStop(0, tint);
  ramp.addColorStop(0.42, tint);
  ramp.addColorStop(1, GLASS);

  ctx.globalAlpha = strength;
  ctx.fillStyle = ramp;
  ctx.fillRect(x, y, width, height);

  // The ceiling wash, and the sill left in its own shadow under it.
  ctx.globalAlpha = Math.min(1, strength + 0.26);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, width, Math.max(1, Math.round(height * 0.13)));

  ctx.globalAlpha = strength * 0.72;
  ctx.fillStyle = SPANDREL_SHADOW;
  for (let notch = Math.round(rand() * 2); notch >= 0; notch -= 1) {
    const w = 2 + rand() * (width * 0.34);
    ctx.fillRect(x + rand() * (width - w), y + height * (0.5 + rand() * 0.3), w, height * 0.3);
  }

  ctx.globalAlpha = 1;
}

/* -------------------------------------------------------------------- the curtain wall */

const GLASS_BAYS = 18;
const GLASS_BAY_PX = 30;
const GLASS_BAY_WIDTH = 1.32;
const GLASS_WIDTH = GLASS_BAYS * GLASS_BAY_PX;

export function createFacadeTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(GLASS_WIDTH, FACADE_HEIGHT, { mipmapped: true });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const rand = mulberry32(CITY_SEED);
  const glassHeight = FLOOR_PX - SPANDREL_PX;
  const paneWidth = GLASS_BAY_PX - MULLION_PX;

  ctx.fillStyle = SPANDREL;
  ctx.fillRect(0, 0, GLASS_WIDTH, FACADE_HEIGHT);

  for (let floor = 0; floor < FACADE_FLOORS; floor += 1) {
    const top = floor * FLOOR_PX + SPANDREL_PX;

    // The floor line: a shadow under the sill and a lit transom over the head, which is what
    // survives minification when every window on the storey is dark.
    ctx.fillStyle = SPANDREL_SHADOW;
    ctx.fillRect(0, top - 3, GLASS_WIDTH, 3);
    ctx.fillStyle = TRANSOM_HIGHLIGHT;
    ctx.fillRect(0, floor * FLOOR_PX, GLASS_WIDTH, 1);

    ctx.fillStyle = GLASS;
    ctx.fillRect(0, top, GLASS_WIDTH, glassHeight);
    for (let bay = 0; bay < GLASS_BAYS; bay += 1) {
      ctx.fillStyle = MULLION;
      ctx.fillRect(bay * GLASS_BAY_PX, floor * FLOOR_PX, MULLION_PX, FLOOR_PX);
      // A mullion is an extrusion, so its outer edge catches the sky and its inner one doesn't.
      ctx.fillStyle = TRANSOM_HIGHLIGHT;
      ctx.fillRect(bay * GLASS_BAY_PX, floor * FLOOR_PX, 1, FLOOR_PX);
    }

    // Dark floors are most of any skyline after hours, and they are what gives the lit ones
    // somewhere to read against. Much past this and a narrow slice of one tower — which is all
    // the reveal shows of the near pair — comes out as a blank panel.
    if (rand() < 0.4) continue;

    const tint = pickOfficeLight(rand());
    // A whole floor lit at once is a trading floor or a lobby; most are partial runs.
    const runs = rand() < 0.12 ? [[0, GLASS_BAYS]] : occupiedRuns(rand, GLASS_BAYS);

    for (const [start, end] of runs) {
      // One room's worth of light falls off across the plate it lights, so a run is not a
      // constant: it is brightest where the lamps are and dims toward whichever end is empty.
      const peak = 0.46 + rand() * 0.5;
      for (let bay = start; bay < end; bay += 1) {
        const across = end === start + 1 ? 0.5 : (bay - start) / (end - 1 - start);
        const falloff = 0.66 + 0.34 * Math.sin(across * Math.PI);
        const x = bay * GLASS_BAY_PX + MULLION_PX;
        paintLitPane(ctx, rand, tint, x, top, paneWidth, glassHeight, peak * falloff);
        ctx.fillStyle = PANE_HIGHLIGHT;
        ctx.fillRect(x, top + glassHeight - 1, paneWidth, 1);
      }
    }
  }

  ctx.globalAlpha = 1;
  texture.needsUpdate = true;
  return texture;
}

/** One to three runs of consecutive lit bays, the way a floor plate is actually occupied. */
function occupiedRuns(rand: () => number, bays: number): (readonly [number, number])[] {
  const runs: (readonly [number, number])[] = [];
  let bay = Math.floor(rand() * 3);
  while (bay < bays) {
    const length = 2 + Math.floor(rand() * 6);
    runs.push([bay, Math.min(bays, bay + length)]);
    bay += length + 1 + Math.floor(rand() * 5);
  }
  return runs;
}

/* ------------------------------------------------------------------------- the masonry */

/**
 * The other half of the city: a pier-and-spandrel block, where the wall is the structure and
 * the window is a hole punched in it.
 *
 * It exists for contrast rather than for accuracy. A curtain wall is a continuous plane, so
 * twenty of them side by side average to one texture at any distance; a punched facade has a
 * pier between every window, which reads as a *vertical* rhythm even when the windows are too
 * small to resolve. Putting a third of the towers in it is what stops the skyline looking
 * printed from a single sheet — and it lights differently too, one room at a time.
 */
const STONE_BAYS = 14;
const STONE_BAY_PX = 38;
const STONE_BAY_WIDTH = 2.5;
const STONE_WIDTH = STONE_BAYS * STONE_BAY_PX;

const STONE = "#32343a";
const STONE_PIER = "#3f424a";
const STONE_REVEAL = "#141518";
const STONE_DARK_WINDOW = "#0a0c10";

export function createMasonryTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(STONE_WIDTH, FACADE_HEIGHT, { mipmapped: true });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const rand = mulberry32(CITY_SEED + 7);
  const openingWidth = Math.round(STONE_BAY_PX * 0.5);
  const openingHeight = Math.round(FLOOR_PX * 0.52);
  const inset = Math.round((STONE_BAY_PX - openingWidth) / 2);
  /** The bay the lifts and the stair run up: masonry all the way, no window on any floor. */
  const service = Math.floor(rand() * STONE_BAYS);

  ctx.fillStyle = STONE;
  ctx.fillRect(0, 0, STONE_WIDTH, FACADE_HEIGHT);

  // The piers: wall between the windows, and no two courses of it quite the same value.
  for (let bay = 0; bay < STONE_BAYS; bay += 1) {
    ctx.globalAlpha = 0.35 + rand() * 0.5;
    ctx.fillStyle = STONE_PIER;
    ctx.fillRect(bay * STONE_BAY_PX, 0, inset, FACADE_HEIGHT);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = STONE_REVEAL;
    ctx.fillRect(bay * STONE_BAY_PX + inset - 1, 0, 1, FACADE_HEIGHT);
  }
  ctx.globalAlpha = 1;

  // The floor course, and a heavier cornice every few storeys: a wall this tall is banded, and
  // an unbroken grid of identical openings is graph paper rather than a building.
  const CORNICE_EVERY = 6;
  for (let floor = 0; floor < FACADE_FLOORS; floor += 1) {
    ctx.fillStyle = STONE_REVEAL;
    ctx.fillRect(0, floor * FLOOR_PX, STONE_WIDTH, 2);
    if (floor % CORNICE_EVERY !== 0) continue;
    ctx.fillStyle = STONE_PIER;
    ctx.fillRect(0, floor * FLOOR_PX - 3, STONE_WIDTH, 3);
    ctx.fillStyle = STONE_REVEAL;
    ctx.fillRect(0, floor * FLOOR_PX + 2, STONE_WIDTH, 2);
  }

  for (let floor = 0; floor < FACADE_FLOORS; floor += 1) {
    const top = floor * FLOOR_PX + Math.round((FLOOR_PX - openingHeight) / 2);

    for (let bay = 0; bay < STONE_BAYS; bay += 1) {
      if (bay === service) continue;
      const x = bay * STONE_BAY_PX + inset;

      // The reveal: a punched window is set back in the wall, and the shadow it casts on its
      // own head is most of what says so.
      ctx.fillStyle = STONE_REVEAL;
      ctx.fillRect(x - 1, top - 1, openingWidth + 2, openingHeight + 2);
      ctx.fillStyle = STONE_DARK_WINDOW;
      ctx.fillRect(x, top, openingWidth, openingHeight);

      // Rooms light one at a time, and a neighbor's light is no reason for yours to be on.
      if (rand() < 0.72) continue;
      paintLitPane(
        ctx,
        rand,
        pickRoomLight(rand()),
        x,
        top,
        openingWidth,
        openingHeight,
        0.4 + rand() * 0.5,
      );
    }
  }

  ctx.globalAlpha = 1;
  texture.needsUpdate = true;
  return texture;
}

/* --------------------------------------------------------------------- the ribbon slab */

/**
 * The third sheet: a concrete frame with the glass run through it in continuous bands.
 *
 * Two glass towers side by side are two glass towers however their tints differ, because the
 * tint multiplies a sheet that is nearly black to begin with — the body color barely survives
 * it, and what the eye actually reads is the *rhythm*. A curtain wall's rhythm is vertical,
 * a punched wall's is a grid, and this one has none at all: the glazing is a horizontal ribbon
 * from corner to corner, broken only by the columns, and it lights in long unbroken lines.
 *
 * It is also the pale one. The spandrel is concrete rather than glass, so these towers stand
 * a full stop lighter than their neighbors and give the skyline something to be dark against.
 */
const RIBBON_BAYS = 20;
const RIBBON_BAY_PX = 26;
const RIBBON_BAY_WIDTH = 1.6;
const RIBBON_WIDTH = RIBBON_BAYS * RIBBON_BAY_PX;
/** Every fifth bay carries a column, which is the only vertical on the whole facade. */
const RIBBON_COLUMN_BAYS = 5;

const CONCRETE = "#666b71";
const CONCRETE_SHADE = "#494e55";
const CONCRETE_LIP = "#8d939b";

export function createRibbonTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(RIBBON_WIDTH, FACADE_HEIGHT, { mipmapped: true });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const rand = mulberry32(CITY_SEED + 11);
  const bandHeight = Math.round(FLOOR_PX * 0.46);
  const bandTop = Math.round((FLOOR_PX - bandHeight) / 2);

  ctx.fillStyle = CONCRETE;
  ctx.fillRect(0, 0, RIBBON_WIDTH, FACADE_HEIGHT);

  for (let floor = 0; floor < FACADE_FLOORS; floor += 1) {
    const top = floor * FLOOR_PX + bandTop;

    // The band, set back behind the slab edge: a lip catches light over it and its own shadow
    // falls under it, which is the whole of why a ribbon facade reads as deep.
    ctx.fillStyle = CONCRETE_LIP;
    ctx.fillRect(0, top - 2, RIBBON_WIDTH, 1);
    ctx.fillStyle = CONCRETE_SHADE;
    ctx.fillRect(0, top - 1, RIBBON_WIDTH, 1);
    ctx.fillStyle = GLASS;
    ctx.fillRect(0, top, RIBBON_WIDTH, bandHeight);

    if (rand() > 0.46) {
      const tint = pickRibbonLight(rand());
      for (const [start, end] of occupiedRuns(rand, RIBBON_BAYS)) {
        const x = start * RIBBON_BAY_PX;
        const width = (end - start) * RIBBON_BAY_PX;
        paintLitPane(ctx, rand, tint, x, top, width, bandHeight, 0.4 + rand() * 0.46);
      }
    }

    ctx.fillStyle = CONCRETE_SHADE;
    ctx.fillRect(0, top + bandHeight, RIBBON_WIDTH, 1);
  }

  // The columns, last, so they stand in front of every band they cross.
  for (let bay = 0; bay < RIBBON_BAYS; bay += RIBBON_COLUMN_BAYS) {
    ctx.fillStyle = CONCRETE;
    ctx.fillRect(bay * RIBBON_BAY_PX, 0, 4, FACADE_HEIGHT);
    ctx.fillStyle = CONCRETE_LIP;
    ctx.fillRect(bay * RIBBON_BAY_PX, 0, 1, FACADE_HEIGHT);
  }

  ctx.globalAlpha = 1;
  texture.needsUpdate = true;
  return texture;
}

/**
 * What one tile of a sheet measures on a building. Every UV out here is in tiles — the unit
 * the texture repeats in — rather than in bays and floors, which is the difference between a
 * tower wearing sixteen windows across and wearing two hundred and fifty.
 */
const TILE_RISE = FACADE_FLOORS * FLOOR_HEIGHT;

const CLADDINGS = {
  glass: { span: GLASS_BAYS * GLASS_BAY_WIDTH, tone: "#9fb4c6" },
  stone: { span: STONE_BAYS * STONE_BAY_WIDTH, tone: "#b9b3a8" },
  ribbon: { span: RIBBON_BAYS * RIBBON_BAY_WIDTH, tone: "#a7afb5" },
} as const;

type Cladding = keyof typeof CLADDINGS;

/**
 * The tints a glass tower's body is multiplied by. One value for the whole city is what made
 * the last skyline monochrome — every tower the same teal, so the only thing separating one
 * from the next was its silhouette. These are all within a stop of each other; the spread is
 * meant to be felt rather than counted.
 */
const GLASS_TONES = [
  "#9fb4c6",
  "#7f9fae",
  "#b0b6c2",
  "#8aa8b2",
  "#a9bcd2",
  "#6f8c99",
  "#c2c3c0",
] as const;

/**
 * The ground the city stands on, and the streets lit across it.
 *
 * It began as one flat plate, which is what a canyon floor looks like from a window when it
 * carries nothing: the towers stopped on a uniform slab and the depth went out of the view from
 * the sill down. What a floor thirty storeys below actually shows is its lighting — a grid of
 * avenues picked out in sodium with the blocks going black between them.
 *
 * The roadway carries that, not the lamps. A street lamp is well under a texel from up here, so
 * a street drawn as lamps averages to nothing in the mip chain and the grid disappears at
 * exactly the distance it is supposed to read at; what survives minification is the roadway
 * itself being brighter than the blocks it runs between. The lamps are drawn on top of it for
 * the near ground, where they are the difference between a lit strip and a street.
 *
 * What it must *not* be is the roadway painted sodium end to end, which is what the first
 * version of that reasoning produced: a tan ribbon the width of a city block, flat from kerb to
 * kerb, reading as carpet laid between the towers. Light on a street comes from two rows of
 * lamps standing along its edges, so the road is brightest at the kerbs and darkest down the
 * middle, and that cross-section is what makes it a street. It averages to the same value in
 * the mip chain and looks like a road at every distance short of it.
 */
const GROUND_SPAN = DOME_RADIUS * 2.1;
/** One tile of the sheet, in meters: three city blocks across. */
const GROUND_TILE = 240;
const GROUND_TEXTURE = 1024;
const GROUND_BLOCKS = 3;
/** How wide an avenue runs, against the block pitch it separates. */
const AVENUE_FRACTION = 0.115;
/** The service street that halves each block: narrower, and lit by fewer lamps. */
const SERVICE_FRACTION = 0.055;

const ASPHALT = "#111820";
/** The tones a low-rise roof comes in. Tar, gravel, a newer membrane, a painted deck. */
const BLOCK_ROOFS = ["#0b1219", "#101820", "#151d26", "#1b232c", "#0d151d", "#222a33"] as const;
/** The alley between two of them, and the parapet edge the street lamps catch. */
const ALLEY = "#05080c";
const PARAPET = "#3a4048";
const LAMP = "#ffb469";
/** A lit window or a roof light on the low-rise between the avenues. */
const BLOCK_LIGHT = "#cfd9e4";

/**
 * One roof plate. The plate is nearly black and its edge is not: a parapet stands a meter
 * proud of it and the avenue lamps rake it, so a roof is outlined on whichever sides the light
 * reaches. That outline is the whole read — it is what turns a field into buildings.
 *
 * Two sides, and not always the same two: a parapet on all four made the field read as tiled
 * floor rather than as roofs standing at their own heights.
 */
function paintRoofPlate(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (width < 3 || height < 3) return;
  ctx.fillStyle = BLOCK_ROOFS[Math.floor(rand() * BLOCK_ROOFS.length)] ?? ALLEY;
  ctx.fillRect(x, y, width - 1, height - 1);

  ctx.globalAlpha = 0.22 + rand() * 0.4;
  ctx.fillStyle = PARAPET;
  if (rand() < 0.5) ctx.fillRect(x, y, width - 1, 1);
  else ctx.fillRect(x, y + height - 2, width - 1, 1);
  if (rand() < 0.5) ctx.fillRect(x, y, 1, height - 1);
  else ctx.fillRect(x + width - 2, y, 1, height - 1);
  ctx.globalAlpha = 1;

  // Rooftop plant: a lift overrun, a tank, a run of ducts. Dark, and it casts nothing.
  for (let unit = Math.round(rand() * 2) - 1; unit >= 0; unit -= 1) {
    ctx.fillStyle = ALLEY;
    ctx.fillRect(
      x + rand() * width * 0.6,
      y + rand() * height * 0.6,
      2 + rand() * 4,
      2 + rand() * 3,
    );
  }
}

/**
 * A parcel of a block, roofed. This is what the blocks were missing: they were one flat dark
 * value between the streets, so the ground read as a lit grid drawn on a void — and a void is
 * exactly what a viewer this high is looking down into for most of the frame.
 *
 * The parcel is cut down to plates by splitting it at a random fraction rather than gridding
 * it, because a grid of equal plates is a floor tile and a block is not: lot widths on any real
 * street run from a shopfront to a department store, and the unequal run is the tell.
 */
function paintRoofs(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const split = (at: number, horizontal: boolean): void => {
    if (horizontal) {
      paintRoofs(ctx, rand, x, y, at, height);
      paintRoofs(ctx, rand, x + at, y, width - at, height);
      return;
    }
    paintRoofs(ctx, rand, x, y, width, at);
    paintRoofs(ctx, rand, x, y + at, width, height - at);
  };

  if (width < 22 && height < 22) return paintRoofPlate(ctx, rand, x, y, width, height);
  if (width < 34 && height < 34 && rand() < 0.45) {
    return paintRoofPlate(ctx, rand, x, y, width, height);
  }

  const cut = 0.3 + rand() * 0.4;
  const horizontal = width >= height;
  split(Math.round((horizontal ? width : height) * cut), horizontal);
}

/**
 * One roadway: dark tarmac, then the two aprons of light its kerb lamps throw, then the lamps
 * themselves. The road runs the long way; its width is the short one.
 */
function paintRoadway(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  x: number,
  y: number,
  width: number,
  height: number,
  gain: number,
): void {
  const vertical = height > width;
  const span = vertical ? width : height;
  const apron = Math.max(1, Math.round(span * 0.2));
  const step = Math.max(6, Math.round(span * 1.9));

  ctx.fillStyle = ASPHALT;
  ctx.fillRect(x, y, width, height);

  ctx.globalAlpha = 0.26 * gain;
  ctx.fillStyle = LAMP;
  if (vertical) {
    ctx.fillRect(x, y, apron, height);
    ctx.fillRect(x + width - apron, y, apron, height);
  } else {
    ctx.fillRect(x, y, width, apron);
    ctx.fillRect(x, y + height - apron, width, apron);
  }

  // The lamps standing in those aprons. Two texels each: enough to read from the sill, small
  // enough to average back into the apron as soon as the ground is more than a block away.
  const run = vertical ? height : width;
  for (let along = step / 2; along < run; along += step) {
    ctx.globalAlpha = (0.5 + rand() * 0.45) * gain;
    if (vertical) {
      ctx.fillRect(x + 1, y + along, 2, 2);
      ctx.fillRect(x + width - 3, y + along + step / 2, 2, 2);
    } else {
      ctx.fillRect(x + along, y + 1, 2, 2);
      ctx.fillRect(x + along + step / 2, y + height - 3, 2, 2);
    }
  }
  ctx.globalAlpha = 1;
}

export function createStreetTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(GROUND_TEXTURE, GROUND_TEXTURE, {
    mipmapped: true,
  });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(GROUND_SPAN / GROUND_TILE, GROUND_SPAN / GROUND_TILE);

  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const rand = mulberry32(CITY_SEED + 2);
  const pitch = GROUND_TEXTURE / GROUND_BLOCKS;
  const avenue = Math.round(pitch * AVENUE_FRACTION);
  const service = Math.round(pitch * SERVICE_FRACTION);

  ctx.fillStyle = ALLEY;
  ctx.fillRect(0, 0, GROUND_TEXTURE, GROUND_TEXTURE);

  // The buildable land: each block quartered by its service streets, and each quarter roofed.
  const bands = [
    [0, Math.round(pitch / 2)],
    [Math.round(pitch / 2), Math.round(pitch)],
  ] as const;
  for (let row = 0; row < GROUND_BLOCKS; row += 1) {
    for (let column = 0; column < GROUND_BLOCKS; column += 1) {
      for (const [y0, y1] of bands) {
        for (const [x0, x1] of bands) {
          const x = Math.round(column * pitch + x0 + (x0 === 0 ? avenue : service));
          const y = Math.round(row * pitch + y0 + (y0 === 0 ? avenue : service));
          const width = Math.round(column * pitch + x1) - x;
          const height = Math.round(row * pitch + y1) - y;
          paintRoofs(ctx, rand, x, y, width, height);
        }
      }
    }
  }

  for (let lane = 0; lane < GROUND_BLOCKS; lane += 1) {
    // The service street runs down the middle of the block its avenue starts.
    const mid = Math.round(lane * pitch + pitch / 2);
    paintRoadway(ctx, rand, mid, 0, service, GROUND_TEXTURE, 0.55);
    paintRoadway(ctx, rand, 0, mid, GROUND_TEXTURE, service, 0.55);
    paintRoadway(ctx, rand, Math.round(lane * pitch), 0, avenue, GROUND_TEXTURE, 1);
    paintRoadway(ctx, rand, 0, Math.round(lane * pitch), GROUND_TEXTURE, avenue, 1);
  }

  // The crossings, which are the brightest thing on any grid seen from above: two roads' worth
  // of lamps meet over one square, and the signals stand in it.
  for (let row = 0; row < GROUND_BLOCKS; row += 1) {
    for (let column = 0; column < GROUND_BLOCKS; column += 1) {
      const x = Math.round(column * pitch);
      const y = Math.round(row * pitch);
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = LAMP;
      ctx.fillRect(x, y, avenue, avenue);
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x + 1, y + 1, 2, 2);
      ctx.fillRect(x + avenue - 3, y + avenue - 3, 2, 2);
    }
  }

  // Roof lights, skylights and the odd lit stairwell on the low-rise between the avenues.
  for (let i = 0; i < 380; i += 1) {
    ctx.globalAlpha = 0.16 + rand() * 0.42;
    ctx.fillStyle = rand() < 0.3 ? LAMP : BLOCK_LIGHT;
    ctx.fillRect(rand() * GROUND_TEXTURE, rand() * GROUND_TEXTURE, 2 + rand() * 4, 2 + rand() * 3);
  }

  ctx.globalAlpha = 1;
  texture.needsUpdate = true;
  return texture;
}

/* ------------------------------------------------------------------ the skyline itself */

/** A footprint corner, as an offset from the tower's own center. */
type Corner = readonly [number, number];

export type TowerSpec = {
  key: string;
  /** Meters out from the window wall, straight through the glass. */
  out: number;
  /** Meters along the wall from the window's center; negative is toward the back wall. */
  side: number;
  width: number;
  depth: number;
  /** How much is taken off each corner. A square-cornered tower is a 1970s tower. */
  chamfer?: number;
  yaw?: number;
  /** Storeys above the street. */
  floors: number;
  /** Footprint scale at the very top; below 1 the shaft tapers the whole way up. */
  taper?: number;
  /** `[fraction of the rise, footprint scale from there up]`, in order. */
  setbacks?: readonly (readonly [number, number])[];
  /** Which sheet the shaft is clad in. Glass unless it says otherwise. */
  clad?: Cladding;
  /** A lit band let into the parapet — what a tower wears instead of a floodlight. */
  crown?: boolean;
  /** A mast above the roof, in meters. */
  mast?: number;
  /** Rooftop plant, for the buildings low enough that their roofs are in shot. */
  mech?: number;
  /**
   * Placed for the oblique sightlines rather than the head-on one: out along the wall at
   * roughly 45°, where a camera anywhere but square-on to the glass is actually looking. These
   * sit outside `IN_FRAME_SPREAD` on purpose, and are the one family that may.
   */
  flank?: boolean;
};

/**
 * The skyline, composed rather than scattered.
 *
 * Two towers stand close enough to be cropped by the reveal and do the framing — they are the
 * parallax, and the only reason the view reads as depth rather than as a backdrop. Between them
 * the middle is left open on purpose: a rank of towers whose tops all fall *inside* the opening,
 * so there is sky above the skyline and a silhouette to read it against. Behind that, roofs low
 * enough to be looked down on, and then two banks that exist to be hazy.
 *
 * `IN_FRAME_SPREAD` and `IN_FRAME_RISE` govern every row here: the mid rank is authored under
 * the second of them and the near pair deliberately over it, and `city.test.ts` holds the table
 * to both. The `flank` rows are the one family exempt from the first — they exist for the
 * sightlines that leave the room at an angle rather than square through the glass.
 */
export const CITY_TOWERS: readonly TowerSpec[] = [
  // The pair that crop the opening. Slim, so they frame the view instead of closing it.
  {
    key: "spire",
    out: 66,
    side: -32,
    width: 28,
    depth: 26,
    chamfer: 5,
    floors: 56,
    taper: 0.8,
    crown: true,
    mast: 16,
  },
  {
    key: "ledge",
    clad: "ribbon",
    out: 88,
    side: 36,
    width: 32,
    depth: 30,
    chamfer: 4,
    floors: 46,
    setbacks: [[0.7, 0.78]],
    crown: true,
  },

  // The rank that makes the skyline: tops inside the opening, sky above every one of them.
  {
    key: "slab",
    clad: "stone",
    out: 140,
    side: 18,
    width: 64,
    depth: 26,
    yaw: 0.12,
    floors: 32,
    crown: true,
  },
  {
    key: "pin",
    out: 158,
    side: -46,
    width: 26,
    depth: 26,
    chamfer: 5,
    floors: 42,
    taper: 0.74,
    crown: true,
    mast: 12,
  },
  {
    key: "deck",
    clad: "stone",
    out: 168,
    side: -12,
    width: 52,
    depth: 42,
    chamfer: 3,
    floors: 17,
    mech: 3,
  },
  {
    key: "block",
    clad: "stone",
    out: 176,
    side: 44,
    width: 38,
    depth: 34,
    chamfer: 3,
    mech: 2,
    floors: 22,
  },
  { key: "court", clad: "stone", out: 218, side: 30, width: 44, depth: 38, floors: 14, mech: 2 },
  {
    key: "crest",
    clad: "ribbon",
    out: 232,
    side: -8,
    width: 34,
    depth: 32,
    chamfer: 6,
    floors: 48,
    taper: 0.76,
    setbacks: [[0.8, 0.82]],
    crown: true,
    mast: 18,
  },
  {
    key: "twin-a",
    clad: "ribbon",
    out: 246,
    side: 70,
    width: 28,
    depth: 26,
    chamfer: 3,
    floors: 36,
    crown: true,
  },
  { key: "stack", clad: "stone", out: 254, side: -84, width: 36, depth: 34, floors: 30 },
  {
    key: "twin-b",
    out: 262,
    side: 92,
    width: 28,
    depth: 26,
    chamfer: 3,
    clad: "ribbon",
    floors: 32,
    crown: true,
  },
  { key: "terrace", clad: "stone", out: 296, side: -40, width: 50, depth: 42, floors: 20, mech: 2 },

  // The banks behind the haze. Lower and broader: detail here is spent on nothing.
  {
    key: "ridge",
    clad: "ribbon",
    out: 330,
    side: 108,
    width: 42,
    depth: 36,
    chamfer: 3,
    floors: 34,
  },
  {
    key: "bar",
    clad: "stone",
    out: 352,
    side: -128,
    width: 50,
    depth: 32,
    yaw: -0.1,
    mech: 3,
    floors: 26,
  },
  {
    key: "needle",
    out: 372,
    side: 26,
    width: 24,
    depth: 24,
    chamfer: 4,
    floors: 46,
    taper: 0.7,
    crown: true,
  },
  {
    key: "mass",
    clad: "ribbon",
    out: 392,
    side: -56,
    width: 44,
    depth: 40,
    chamfer: 4,
    floors: 30,
  },
  { key: "plate", clad: "stone", out: 428, side: 168, width: 46, depth: 34, mech: 3, floors: 24 },
  { key: "col", out: 452, side: -198, width: 32, depth: 30, chamfer: 3, floors: 38, crown: true },
  { key: "far-a", clad: "ribbon", out: 482, side: 60, width: 38, depth: 34, floors: 28 },
  {
    key: "far-b",
    clad: "stone",
    out: 512,
    side: -92,
    width: 42,
    depth: 36,
    chamfer: 3,
    floors: 32,
  },
  { key: "far-c", out: 538, side: 214, width: 36, depth: 32, floors: 26 },
  { key: "far-d", clad: "stone", out: 566, side: -252, width: 40, depth: 36, mech: 2, floors: 22 },
  {
    key: "far-e",
    clad: "ribbon",
    out: 592,
    side: 138,
    width: 46,
    depth: 38,
    chamfer: 3,
    floors: 34,
  },
  { key: "far-f", out: 618, side: -18, width: 42, depth: 36, floors: 28 },
  { key: "far-g", clad: "stone", out: 646, side: -160, width: 48, depth: 40, mech: 2, floors: 24 },

  // The flanks. A camera anywhere but square-on to the glass looks out along the wall rather
  // than through it, and every one of those sightlines used to leave the window on bare haze.
  {
    flank: true,
    key: "flank-a",
    clad: "ribbon",
    out: 118,
    side: -112,
    width: 34,
    depth: 30,
    chamfer: 4,
    floors: 34,
    crown: true,
  },
  {
    flank: true,
    key: "flank-b",
    clad: "stone",
    out: 196,
    side: -184,
    width: 40,
    depth: 34,
    floors: 28,
  },
  {
    flank: true,
    key: "flank-c",
    out: 286,
    side: -268,
    width: 44,
    depth: 38,
    chamfer: 3,
    floors: 32,
  },
  { flank: true, key: "flank-d", out: 404, side: -372, width: 46, depth: 40, floors: 26 },
  {
    flank: true,
    key: "flank-e",
    clad: "ribbon",
    out: 152,
    side: 128,
    width: 32,
    depth: 30,
    chamfer: 3,
    floors: 30,
  },
  { flank: true, key: "flank-f", out: 268, side: 236, width: 42, depth: 36, floors: 26 },

  // The rest of the run out to the wall. Free-look lets a visitor stand 30 cm from the glass,
  // and from there the opening is not a frame but a fan: the sightline through its far edge
  // leaves at better than 80° off the normal. Everything past `flank-f` used to be sky, so
  // walking to the window and turning your head ran the city out. These carry the sweep on to
  // roughly 84°, each span overlapping its neighbor's — `city.test.ts` measures the union and
  // fails on a hole, because no station camera can see one.
  {
    flank: true,
    key: "flank-g",
    out: 148,
    side: -95,
    width: 46,
    depth: 34,
    chamfer: 3,
    floors: 41,
    crown: true,
  },
  {
    flank: true,
    key: "flank-h",
    clad: "stone",
    out: 164,
    side: -149,
    width: 44,
    depth: 34,
    floors: 36,
  },
  {
    flank: true,
    key: "flank-i",
    out: 142,
    side: -173,
    width: 56,
    depth: 44,
    chamfer: 5,
    floors: 40,
    crown: true,
  },
  {
    flank: true,
    key: "flank-j",
    clad: "ribbon",
    out: 173,
    side: -266,
    width: 54,
    depth: 40,
    chamfer: 4,
    floors: 34,
    crown: true,
  },
  {
    flank: true,
    key: "flank-k",
    clad: "stone",
    out: 172,
    side: 108,
    width: 48,
    depth: 40,
    chamfer: 4,
    floors: 42,
  },
  {
    flank: true,
    key: "flank-l",
    clad: "stone",
    out: 154,
    side: 139,
    width: 48,
    depth: 36,
    chamfer: 3,
    floors: 33,
  },
  {
    flank: true,
    key: "flank-m",
    out: 134,
    side: 159,
    width: 42,
    depth: 30,
    chamfer: 3,
    floors: 42,
    crown: true,
  },
  {
    flank: true,
    key: "flank-n",
    clad: "stone",
    out: 165,
    side: 243,
    width: 50,
    depth: 34,
    floors: 33,
  },
  {
    flank: true,
    key: "flank-o",
    clad: "ribbon",
    out: 137,
    side: 239,
    width: 40,
    depth: 26,
    chamfer: 4,
    floors: 34,
    crown: true,
  },

  /*
   * The street wall: the buildings across the road, receding down it both ways. They sit close
   * and far to the side, which is the only place geometry can be to fill a look taken along the
   * glass — and every one clears `STREET_Y` by more than this floor stands above it, because a
   * neighbor shorter than the room is one you look over rather than at.
   */
  {
    flank: true,
    key: "street-a",
    clad: "stone",
    out: 68,
    side: -131,
    width: 68,
    depth: 58,
    chamfer: 3,
    floors: 40,
  },
  {
    flank: true,
    key: "street-b",
    clad: "ribbon",
    out: 56,
    side: -162,
    width: 62,
    depth: 46,
    chamfer: 3,
    floors: 47,
    crown: true,
  },
  {
    flank: true,
    key: "street-c",
    out: 76,
    side: -284,
    width: 58,
    depth: 48,
    chamfer: 3,
    floors: 45,
    crown: true,
  },
  {
    flank: true,
    key: "street-d",
    clad: "stone",
    out: 52,
    side: -248,
    width: 74,
    depth: 50,
    chamfer: 3,
    floors: 48,
    crown: true,
  },
  {
    flank: true,
    key: "street-e",
    out: 66,
    side: -387,
    width: 120,
    depth: 62,
    chamfer: 5,
    floors: 40,
    crown: true,
  },
  {
    flank: true,
    key: "street-f",
    clad: "stone",
    out: 57,
    side: -461,
    width: 84,
    depth: 66,
    chamfer: 3,
    floors: 42,
    crown: true,
  },
  { flank: true, key: "street-g", out: 69, side: -695, width: 78, depth: 58, floors: 39 },
  {
    flank: true,
    key: "street-h",
    out: 50,
    side: 107,
    width: 72,
    depth: 50,
    chamfer: 4,
    floors: 44,
  },
  {
    flank: true,
    key: "street-i",
    clad: "stone",
    out: 74,
    side: 240,
    width: 74,
    depth: 60,
    floors: 46,
  },
  {
    flank: true,
    key: "street-j",
    out: 76,
    side: 314,
    width: 72,
    depth: 48,
    chamfer: 3,
    floors: 45,
  },
];

/** Which towers carry an aviation light. Only the tall ones do, and it is red, and it is small. */
const BEACON_TOWERS = new Set(["spire", "pin", "crest", "needle"]);
const BEACON_COLOR = "#ff5545";
const BEACON_SIZE = 1.1;

const CROWN_HEIGHT = 1.2;
/**
 * What a crown is lit in. Bright enough to catch the bloom, dark enough that the band never
 * reads as a white lid — and more than one of them, because a single value put the same strip
 * of pale blue on the head of every crowned tower in the city, which is the sort of repetition
 * the eye finds before it finds the buildings.
 */
const CROWN_COLORS = ["#5b6f7c", "#6f7681", "#7d7361", "#5f6c70", "#7b828a"] as const;
const MAST_WIDTH = 0.7;
const ROOF_COLOR = "#0c1219";
const ROOF_KERB = 0.9;

/**
 * A footprint, wound so that walking it counter-clockwise from above leaves the outside on the
 * right. Every face and cap in the city is emitted from this order, so the winding is what
 * decides which way they face: reversed, the towers render as their own interiors and the roofs
 * face the pavement. It is also what `facetShade` reads a face's aspect from.
 *
 * The chamfer is not decoration. A square-cornered extrusion is the shape that made the last
 * skyline read as stacked blocks, and cutting the corners is most of what separates a modern
 * tower from one.
 */
function chamferedRect(width: number, depth: number, chamfer: number): readonly Corner[] {
  const hw = width / 2;
  const hd = depth / 2;
  const c = Math.min(chamfer, Math.min(hw, hd) * 0.6);
  if (c <= 0) {
    return [
      [hw, -hd],
      [-hw, -hd],
      [-hw, hd],
      [hw, hd],
    ];
  }
  return [
    [hw, -hd + c],
    [hw - c, -hd],
    [-hw + c, -hd],
    [-hw, -hd + c],
    [-hw, hd - c],
    [-hw + c, hd],
    [hw - c, hd],
    [hw, hd - c],
  ];
}

type Segment = { y0: number; y1: number; bottom: number; top: number };

function segmentsOf(spec: TowerSpec): readonly Segment[] {
  const rise = spec.floors * FLOOR_HEIGHT;
  const taper = spec.taper ?? 1;
  const steps: (readonly [number, number])[] = [[0, 1], ...(spec.setbacks ?? [])];
  return steps.map(([fraction, scale], index) => {
    const next = steps[index + 1]?.[0] ?? 1;
    return {
      y0: STREET_Y + rise * fraction,
      y1: STREET_Y + rise * next,
      bottom: scale * (1 + (taper - 1) * fraction),
      top: scale * (1 + (taper - 1) * next),
    };
  });
}

/** An accumulating buffer: one of these per finish, and each becomes one draw call. */
type Buffer = { positions: number[]; uvs: number[]; colors: number[]; indices: number[] };

function buffer(): Buffer {
  return { positions: [], uvs: [], colors: [], indices: [] };
}

function toGeometry(source: Buffer, textured: boolean): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(source.positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(source.colors, 3));
  if (textured) geometry.setAttribute("uv", new Float32BufferAttribute(source.uvs, 2));
  geometry.setIndex(source.indices);
  geometry.computeBoundingSphere();
  return geometry;
}

const shadeColor = new Color();
const baseColor = new Color();

/**
 * How bright a face is, from how squarely it faces the glass. The materials out here are
 * unlit, so without this a chamfered tower is a flat silhouette with windows printed on it —
 * every facet returning exactly the same value is the tell.
 */
function facetShade(normalX: number): number {
  return 0.34 + 0.66 * (0.5 + 0.5 * normalX);
}

/**
 * Aerial perspective, applied up a single tower rather than across the view.
 *
 * The haze shells already separate the near towers from the far ones. What they cannot do is
 * separate the bottom of one tower from its top, and a two-hundred-meter shaft at one flat
 * value is the last thing holding these to reading as extruded rectangles. In a lit city the
 * murk is *below* you: the glow pooled over the streets washes the lower storeys and thins out
 * with every floor above them, so a facade is palest at its base and cleanest at its crown.
 */
const GLOW_BASE = 1.24;
const GLOW_TOP = 0.86;
const GLOW_RISE = FACADE_FLOORS * FLOOR_HEIGHT;

function groundGlow(y: number): number {
  const rise = Math.min(1, Math.max(0, (y - STREET_Y) / GLOW_RISE));
  return GLOW_BASE + (GLOW_TOP - GLOW_BASE) * rise;
}

type Quad = readonly [Corner, number, Corner, number];

function pushQuad(
  target: Buffer,
  center: readonly [number, number],
  quad: Quad,
  uv: readonly [number, number, number, number] | null,
  rgb: readonly [number, number, number],
): void {
  const [a, ay, b, by] = quad;
  const first = target.positions.length / 3;
  const corners: readonly (readonly [Corner, number])[] = [
    [a, ay],
    [b, ay],
    [b, by],
    [a, by],
  ];
  for (const [corner, y] of corners) {
    target.positions.push(center[0] + corner[0], y, center[1] + corner[1]);
    target.colors.push(rgb[0], rgb[1], rgb[2]);
  }
  if (uv) {
    const [u0, v0, u1, v1] = uv;
    target.uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
  }
  target.indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
}

/**
 * A wall between two rings at two heights — the tapered case of a quad, which the crown, the
 * mast and the parapet do not need and the shaft always does.
 */
function pushQuadTapered(
  target: Buffer,
  center: readonly [number, number],
  bottom: Quad,
  top: Quad,
  uv: readonly [number, number, number, number],
  rgbBottom: readonly [number, number, number],
  rgbTop: readonly [number, number, number],
): void {
  const first = target.positions.length / 3;
  const corners: readonly (readonly [Corner, number, readonly [number, number, number]])[] = [
    [bottom[0], bottom[1], rgbBottom],
    [bottom[2], bottom[3], rgbBottom],
    [top[2], top[3], rgbTop],
    [top[0], top[1], rgbTop],
  ];
  for (const [corner, y, rgb] of corners) {
    target.positions.push(center[0] + corner[0], y, center[1] + corner[1]);
    target.colors.push(rgb[0], rgb[1], rgb[2]);
  }
  const [u0, v0, u1, v1] = uv;
  target.uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
  target.indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
}

/** A flat cap over a ring, as a fan from its first corner. */
function pushCap(
  target: Buffer,
  center: readonly [number, number],
  ring: readonly Corner[],
  y: number,
  rgb: readonly [number, number, number],
): void {
  const first = target.positions.length / 3;
  for (const corner of ring) {
    target.positions.push(center[0] + corner[0], y, center[1] + corner[1]);
    target.colors.push(rgb[0], rgb[1], rgb[2]);
  }
  for (let i = 1; i + 1 < ring.length; i += 1) {
    target.indices.push(first, first + i, first + i + 1);
  }
}

function scaleRing(ring: readonly Corner[], scale: number, yaw: number): readonly Corner[] {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return ring.map(([x, z]) => {
    const sx = x * scale;
    const sz = z * scale;
    return [sx * cos - sz * sin, sx * sin + sz * cos] as Corner;
  });
}

type CityGeometry = {
  facades: BufferGeometry;
  masonry: BufferGeometry;
  ribbons: BufferGeometry;
  roofs: BufferGeometry;
  crowns: BufferGeometry;
  beacons: BufferGeometry;
};

/**
 * The closed run of edges around a footprint, paired with the same run on the ring above it —
 * which is what a wall between two heights is. The modulo keeps every index in range; the
 * empty branch is what makes that visible to the type, and never taken.
 */
type Wall = { a: Corner; b: Corner; aTop: Corner; bTop: Corner };

function wallsBetween(bottom: readonly Corner[], top: readonly Corner[]): Wall[] {
  return bottom.flatMap((a, index) => {
    const next = (index + 1) % bottom.length;
    const b = bottom[next];
    const aTop = top[index];
    const bTop = top[next];
    return b && aTop && bTop ? [{ a, b, aTop, bTop }] : [];
  });
}

/** The same run around a single ring, for the parts that do not taper. */
function edgesOf(ring: readonly Corner[]): (readonly [Corner, Corner])[] {
  return wallsBetween(ring, ring).map(({ a, b }) => [a, b] as const);
}

/** An edge's outward aspect. Only x matters: everything out here faces the one window. */
function edgeShade(a: Corner, b: Corner): number {
  const edgeZ = b[1] - a[1];
  const length = Math.hypot(b[0] - a[0], edgeZ) || 1;
  // The ring is wound counter-clockwise in xz, so the outward normal is the edge turned right.
  return facetShade(-edgeZ / length);
}

function rgbOf(hex: string, gain: number): readonly [number, number, number] {
  shadeColor.copy(baseColor.set(hex)).multiplyScalar(gain);
  return [shadeColor.r, shadeColor.g, shadeColor.b];
}

/** A short prism standing on a ring: a crown band, a parapet, a mast, a beacon. */
function pushBand(
  target: Buffer,
  center: readonly [number, number],
  ring: readonly Corner[],
  y0: number,
  y1: number,
  rgb: readonly [number, number, number],
): void {
  for (const [a, b] of edgesOf(ring)) pushQuad(target, center, [a, y0, b, y1], null, rgb);
}

type Tower = {
  spec: TowerSpec;
  center: readonly [number, number];
  yaw: number;
  tone: number;
  /** The body tint this tower's sheet is multiplied by, picked once per building. */
  body: string;
  /** The ring and height the shaft finished on: what everything above it stands on. */
  topRing: readonly Corner[];
  topY: number;
};

/** The shaft: every segment's four-to-eight walls, and the cap that closes each one. */
function pushShaft(city: Buffers, tower: Tower, uOffset: number, vOffset: number): Tower {
  const { spec, center, yaw, tone, body } = tower;
  const clad = spec.clad ?? "glass";
  const span = CLADDINGS[clad].span;
  const wall = clad === "glass" ? city.facades : clad === "stone" ? city.masonry : city.ribbons;
  const footprint = chamferedRect(spec.width, spec.depth, spec.chamfer ?? 0);
  let topRing = tower.topRing;
  let topY = tower.topY;

  for (const segment of segmentsOf(spec)) {
    const bottom = scaleRing(footprint, segment.bottom, yaw);
    const top = scaleRing(footprint, segment.top, yaw);
    const v0 = (segment.y0 - STREET_Y) / TILE_RISE + vOffset;
    const v1 = (segment.y1 - STREET_Y) / TILE_RISE + vOffset;
    const glow0 = groundGlow(segment.y0);
    const glow1 = groundGlow(segment.y1);

    let run = uOffset;
    for (const { a, b, aTop, bTop } of wallsBetween(bottom, top)) {
      const u1 = run + (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1) / span;
      const shade = edgeShade(a, b) * tone;
      pushQuadTapered(
        wall,
        center,
        [a, segment.y0, b, segment.y0],
        [aTop, segment.y1, bTop, segment.y1],
        [run, v0, u1, v1],
        rgbOf(body, shade * glow0),
        rgbOf(body, shade * glow1),
      );
      run = u1;
    }

    pushCap(city.roofs, center, top, segment.y1, rgbOf(ROOF_COLOR, tone * glow1));
    topRing = top;
    topY = segment.y1;
  }

  return { ...tower, topRing, topY };
}

/**
 * What the tower wears at the top. A crowned one gets a lit band let into the parapet; every
 * other one gets the parapet alone, so the roof plate reads as a surface with an edge rather
 * than a lid resting on the shaft.
 */
function pushCrown(city: Buffers, tower: Tower, rand: () => number): void {
  const { spec, center, tone, topRing, topY } = tower;
  const glow = groundGlow(topY);

  if (spec.crown) {
    const color = CROWN_COLORS[Math.floor(rand() * CROWN_COLORS.length)] ?? CROWN_COLORS[0];
    const band = scaleRing(topRing, 1.012, 0);
    pushBand(
      city.crowns,
      center,
      band,
      topY - CROWN_HEIGHT,
      topY,
      rgbOf(color, 0.58 + rand() * 0.3),
    );
    // A parapet still stands above the band; without it the lit strip is the top of the tower
    // and the crown reads as a lid rather than as something let into one.
    const kerb = scaleRing(topRing, 1.01, 0);
    pushBand(city.roofs, center, kerb, topY, topY + ROOF_KERB * 0.6, rgbOf(ROOF_COLOR, 1.4 * tone));
    pushCap(city.roofs, center, kerb, topY + ROOF_KERB * 0.6, rgbOf(ROOF_COLOR, 0.8 * tone));
    return;
  }

  const kerb = scaleRing(topRing, 1.01, 0);
  pushBand(city.roofs, center, kerb, topY, topY + ROOF_KERB, rgbOf(ROOF_COLOR, 1.6 * tone * glow));
  pushCap(city.roofs, center, kerb, topY + ROOF_KERB, rgbOf(ROOF_COLOR, 0.8 * tone * glow));
}

/** Rooftop plant, for the buildings low enough that a viewer looks down onto their roofs. */
function pushRoofPlant(city: Buffers, tower: Tower, rand: () => number): void {
  const { spec, center, yaw, tone, topY } = tower;

  for (let unit = 0; unit < (spec.mech ?? 0); unit += 1) {
    const size = 3 + rand() * 5;
    const height = 2 + rand() * 3;
    const offsetX = (rand() - 0.5) * (spec.width - size - 3);
    const offsetZ = (rand() - 0.5) * (spec.depth - size - 3);
    const ring = scaleRing(chamferedRect(size, size * (0.6 + rand() * 0.8), 0), 1, yaw).map(
      ([x, z]) => [x + offsetX, z + offsetZ] as Corner,
    );

    for (const [a, b] of edgesOf(ring)) {
      const rgb = rgbOf(ROOF_COLOR, edgeShade(a, b) * 2.2 * tone);
      pushQuad(city.roofs, center, [a, topY, b, topY + height], null, rgb);
    }
    pushCap(city.roofs, center, ring, topY + height, rgbOf(ROOF_COLOR, 1.3 * tone));
  }
}

/** The mast, and the aviation light on whatever it ends at. */
function pushMast(city: Buffers, tower: Tower): void {
  const { spec, center, topY } = tower;
  const mastTop = topY + (spec.mast ?? 0);

  if (spec.mast) {
    const mast = chamferedRect(MAST_WIDTH, MAST_WIDTH, 0);
    pushBand(city.roofs, center, mast, topY, mastTop, rgbOf(ROOF_COLOR, 2.1));
  }
  if (BEACON_TOWERS.has(spec.key)) {
    const light = chamferedRect(BEACON_SIZE, BEACON_SIZE, 0);
    pushBand(city.beacons, center, light, mastTop, mastTop + BEACON_SIZE, rgbOf(BEACON_COLOR, 1));
  }
}

type Buffers = Record<keyof CityGeometry, Buffer>;

export function createCityGeometry(): CityGeometry {
  const rand = mulberry32(CITY_SEED + 1);
  const city: Buffers = {
    facades: buffer(),
    masonry: buffer(),
    ribbons: buffer(),
    roofs: buffer(),
    crowns: buffer(),
    beacons: buffer(),
  };

  for (const spec of CITY_TOWERS) {
    const yaw = spec.yaw ?? 0;
    const clad = spec.clad ?? "glass";
    const base: Tower = {
      spec,
      center: [ROOM.minX - spec.out, CITY_WINDOW.centerZ + spec.side],
      yaw,
      // Enough spread that no two shafts are the same value, not enough to read as a palette.
      tone: 0.74 + rand() * 0.3,
      body:
        clad === "glass"
          ? (GLASS_TONES[Math.floor(rand() * GLASS_TONES.length)] ?? CLADDINGS.glass.tone)
          : CLADDINGS[clad].tone,
      topRing: scaleRing(chamferedRect(spec.width, spec.depth, spec.chamfer ?? 0), 1, yaw),
      topY: STREET_Y,
    };
    // Two towers reading the sheet from the same place would be the same building.
    const tower = pushShaft(city, base, rand(), rand());

    pushCrown(city, tower, rand);
    pushMast(city, tower);
    pushRoofPlant(city, tower, rand);
  }

  return {
    facades: toGeometry(city.facades, true),
    masonry: toGeometry(city.masonry, true),
    ribbons: toGeometry(city.ribbons, true),
    roofs: toGeometry(city.roofs, false),
    crowns: toGeometry(city.crowns, false),
    beacons: toGeometry(city.beacons, false),
  };
}

/** The three depths the haze thickens at. A tower loses contrast per shell it stands behind. */
const HAZE_SHELLS = [
  { radius: 150, opacity: 0.2 },
  { radius: 320, opacity: 0.28 },
  { radius: 560, opacity: 0.38 },
] as const;

function Skyline(): ReactElement {
  const facade = useDisposable(() => createFacadeTexture());
  const masonry = useDisposable(() => createMasonryTexture());
  const ribbon = useDisposable(() => createRibbonTexture());
  const sky = useDisposable(() => createSkyTexture());
  const haze = useDisposable(() => createHazeTexture());
  const streets = useDisposable(() => createStreetTexture());
  const city = useDisposable(() => createCityGeometry());

  return (
    <group position={DOME_CENTER}>
      <mesh>
        <sphereGeometry args={[DOME_RADIUS, 24, 16]} />
        <meshBasicMaterial map={sky} side={BackSide} toneMapped={false} fog={false} />
      </mesh>

      <group position={[-DOME_CENTER[0], -DOME_CENTER[1], -DOME_CENTER[2]]}>
        <mesh geometry={city.facades}>
          <meshBasicMaterial map={facade} vertexColors toneMapped={false} fog={false} />
        </mesh>
        <mesh geometry={city.masonry}>
          <meshBasicMaterial map={masonry} vertexColors toneMapped={false} fog={false} />
        </mesh>
        <mesh geometry={city.ribbons}>
          <meshBasicMaterial map={ribbon} vertexColors toneMapped={false} fog={false} />
        </mesh>
        <mesh geometry={city.roofs}>
          <meshBasicMaterial vertexColors toneMapped={false} fog={false} />
        </mesh>
        <mesh geometry={city.crowns}>
          <meshBasicMaterial vertexColors toneMapped={false} fog={false} />
        </mesh>
        <mesh geometry={city.beacons}>
          <meshBasicMaterial vertexColors toneMapped={false} fog={false} />
        </mesh>

        <mesh
          position={[ROOM.minX - DOME_RADIUS / 3, STREET_Y, CITY_WINDOW.centerZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[GROUND_SPAN, GROUND_SPAN]} />
          <meshBasicMaterial map={streets} toneMapped={false} fog={false} />
        </mesh>
      </group>

      {HAZE_SHELLS.map((shell) => (
        <mesh key={shell.radius} renderOrder={shell.radius}>
          <sphereGeometry args={[shell.radius, 20, 14]} />
          <meshBasicMaterial
            map={haze}
            side={BackSide}
            transparent
            opacity={shell.opacity}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}

const W = CITY_WINDOW.width;
const H = CITY_WINDOW.height;
const FRAME = 0.07;
const FRAME_DEPTH = 0.14;
const MULLION_BAR = 0.035;

type Bar = { size: [number, number, number]; position: [number, number, number] };

const FRAME_BARS: Bar[] = [
  { size: [W + FRAME * 2, FRAME, FRAME_DEPTH], position: [0, H / 2 + FRAME / 2, 0] },
  { size: [W + FRAME * 2, FRAME, FRAME_DEPTH], position: [0, -H / 2 - FRAME / 2, 0] },
  { size: [FRAME, H + FRAME * 2, FRAME_DEPTH], position: [-W / 2 - FRAME / 2, 0, 0] },
  { size: [FRAME, H + FRAME * 2, FRAME_DEPTH], position: [W / 2 + FRAME / 2, 0, 0] },
];

const MULLION_BARS: Bar[] = [
  { size: [MULLION_BAR, H, MULLION_BAR * 1.6], position: [-W / 4, 0, 0] },
  { size: [MULLION_BAR, H, MULLION_BAR * 1.6], position: [W / 4, 0, 0] },
  { size: [W, MULLION_BAR, MULLION_BAR * 1.6], position: [0, 0, 0] },
];

export function CityWindow(): ReactElement {
  return (
    <>
      <Skyline />

      <group
        position={[ROOM.minX, CITY_WINDOW.centerY, CITY_WINDOW.centerZ]}
        rotation={[0, Math.PI / 2, 0]}
      >
        {/*
          Unlit, deliberately. This was a `meshStandardMaterial` at `roughness: 0.08` — a
          near-mirror — so every point light in the room threw a tight specular highlight onto
          it: half a dozen pin-sharp dots scattered across the glass, which bloom then blew up
          into white and cyan stars hanging in front of the skyline. They tracked the camera,
          so they read as fireflies in the city rather than as reflections on a pane. Glass this
          size shows its tint and nothing else; the frame is what says there is a window here.
        */}
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial
            color={worldColors.accent}
            transparent
            opacity={0.035}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {[...FRAME_BARS, ...MULLION_BARS].map((bar) => (
          <mesh key={`${bar.position.join(",")}:${bar.size.join(",")}`} position={bar.position}>
            <boxGeometry args={bar.size} />
            <meshStandardMaterial {...frameMaterial} />
          </mesh>
        ))}

        <mesh position={[0, -H / 2 - FRAME / 2, FRAME_DEPTH / 2]}>
          <boxGeometry args={[W, 0.012, 0.012]} />
          <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
        </mesh>

        <pointLight
          position={[0, 0.1, 0.6]}
          intensity={0.5}
          distance={5}
          decay={2}
          color="#bfe9ff"
        />
      </group>
    </>
  );
}

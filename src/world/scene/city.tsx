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
 * - **One curtain wall, tiled.** Every tower samples the same seamless facade sheet, scaled so
 *   a floor is `FLOOR_HEIGHT` and a bay is `BAY_WIDTH` on every building in the city. Towers
 *   differ by where they start reading it, which is a UV offset rather than a texture each.
 * - **One geometry per finish.** Facades, roofs, crowns and beacons merge into four buffers
 *   with the placement baked in — the pattern `scene/books.tsx` uses, and for the same reason:
 *   per-face UVs are what instancing cannot express. Nothing out here animates, so the
 *   transform an `InstancedMesh` would carry per copy is spent once at build time instead.
 * - **Facets, not shading.** The materials are unlit — a city at night is lit from inside, not
 *   by anything in this room — so the turn of a corner has to come from somewhere. Each face
 *   carries a vertex color set from how squarely it faces the glass, which is what stops a
 *   tower reading as a flat sticker.
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
const BAY_WIDTH = 1.45;

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
  [0.28, "#060b13"],
  [0.41, "#0b1622"],
  [0.472, "#16293a"],
  [0.5, "#33505f"],
  [0.523, "#20333f"],
  [0.57, "#131f29"],
  [0.68, "#0b1219"],
  [1.0, "#05080b"],
] as const;

/**
 * The haze: the same ramp again, carrying an alpha that peaks at the horizon and thins with
 * altitude. Three shells of it stand between the viewer and the far bank, so a tower loses
 * contrast with every one it sits behind.
 */
const HAZE_STOPS = [
  [0.0, "rgba(10,17,24,0.95)"],
  [0.4, "rgba(17,32,43,0.92)"],
  [0.48, "rgba(38,62,76,0.95)"],
  [0.5, "rgba(51,80,95,1)"],
  [0.53, "rgba(32,51,63,0.9)"],
  [0.6, "rgba(19,31,41,0.6)"],
  [0.72, "rgba(11,18,26,0.28)"],
  [1.0, "rgba(6,10,15,0.1)"],
] as const;

const SKY_TEXTURE_WIDTH = 8;
const SKY_TEXTURE_HEIGHT = 512;

function paintVerticalRamp(
  stops: readonly (readonly [number, string])[],
  mipmapped: boolean,
): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(SKY_TEXTURE_WIDTH, SKY_TEXTURE_HEIGHT, {
    mipmapped,
  });
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  // Canvas y runs down and texture v runs up, so the ramp is painted from the zenith.
  const gradient = ctx.createLinearGradient(0, 0, 0, SKY_TEXTURE_HEIGHT);
  for (const [offset, color] of stops) gradient.addColorStop(1 - offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SKY_TEXTURE_WIDTH, SKY_TEXTURE_HEIGHT);

  texture.needsUpdate = true;
  return texture;
}

export function createSkyTexture(): CanvasTexture {
  return paintVerticalRamp(SKY_STOPS, false);
}

export function createHazeTexture(): CanvasTexture {
  return paintVerticalRamp(HAZE_STOPS, false);
}

/**
 * The curtain wall every tower is clad in: one seamless sheet of glass, mullions and lit
 * floors, tiled across the whole city so a storey is the same height on every building in it.
 *
 * Offices light by the floor plate, not by the window — a lit floor is a run of bays with the
 * ceiling washed white and the sill in shadow, and the floor above it is often dark. That is
 * what the runs and the top edge below are for. Scattering individually lit windows over a
 * facade, which is what this used to do, reads as an advent calendar.
 */
const FACADE_BAYS = 16;
const FACADE_FLOORS = 32;
const BAY_PX = 32;
const FLOOR_PX = 32;
const FACADE_WIDTH = FACADE_BAYS * BAY_PX;
const FACADE_HEIGHT = FACADE_FLOORS * FLOOR_PX;

/**
 * What one tile of the sheet measures on a building. Every UV out here is in tiles — the unit
 * the texture repeats in — rather than in bays and floors, which is the difference between a
 * tower wearing sixteen windows across and wearing two hundred and fifty.
 */
const TILE_SPAN = FACADE_BAYS * BAY_WIDTH;
const TILE_RISE = FACADE_FLOORS * FLOOR_HEIGHT;
/** The band of structure under each floor's glass, and the mullion between each pair of bays. */
const SPANDREL_PX = 10;
const MULLION_PX = 3;

const GLASS = "#0a1017";
const SPANDREL = "#101a23";
const MULLION = "#1e2b37";
/** The cool line where a pane catches the sky. Hard-edged: a soft one reads as a smudge. */
const PANE_HIGHLIGHT = "rgba(120,160,185,0.5)";

/**
 * Pigments the facade is painted with, not surface tokens: warm desk lamps, the neutral white
 * of a lit ceiling, the cold cast of a floor left on for the cleaners, and one cyan that ties
 * the city to the room it is seen from.
 */
const OFFICE_LIGHT = ["#ffdfaa", "#f3f7fb", "#c6dcef", "#86d6e8"] as const;

/** The unlit body tone the facade sheet is multiplied by; the sheet carries the windows. */
const GLASS_TONE = "#9fb4c6";

function pickOfficeLight(roll: number): string {
  if (roll < 0.44) return OFFICE_LIGHT[0];
  if (roll < 0.78) return OFFICE_LIGHT[1];
  if (roll < 0.95) return OFFICE_LIGHT[2];
  return OFFICE_LIGHT[3];
}

export function createFacadeTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(FACADE_WIDTH, FACADE_HEIGHT, { mipmapped: true });
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const rand = mulberry32(CITY_SEED);
  const glassHeight = FLOOR_PX - SPANDREL_PX;
  const paneWidth = BAY_PX - MULLION_PX;

  ctx.fillStyle = SPANDREL;
  ctx.fillRect(0, 0, FACADE_WIDTH, FACADE_HEIGHT);

  for (let floor = 0; floor < FACADE_FLOORS; floor += 1) {
    const top = floor * FLOOR_PX + SPANDREL_PX;

    ctx.fillStyle = GLASS;
    ctx.fillRect(0, top, FACADE_WIDTH, glassHeight);
    ctx.fillStyle = MULLION;
    for (let bay = 0; bay < FACADE_BAYS; bay += 1) {
      ctx.fillRect(bay * BAY_PX, floor * FLOOR_PX, MULLION_PX, FLOOR_PX);
    }

    // Dark floors are most of any skyline after hours, and they are what gives the lit ones
    // somewhere to read against. Much past this and a narrow slice of one tower — which is all
    // the reveal shows of the near pair — comes out as a blank panel.
    if (rand() < 0.4) continue;

    const tint = pickOfficeLight(rand());
    // A whole floor lit at once is a trading floor or a lobby; most are partial runs.
    const runs = rand() < 0.12 ? [[0, FACADE_BAYS]] : occupiedRuns(rand, FACADE_BAYS);

    for (const [start, end] of runs) {
      for (let bay = start; bay < end; bay += 1) {
        const x = bay * BAY_PX + MULLION_PX;
        ctx.globalAlpha = 0.38 + rand() * 0.52;
        ctx.fillStyle = tint;
        ctx.fillRect(x, top, paneWidth, glassHeight);
        // The ceiling wash: the brightest part of a lit office is the top of the glass.
        ctx.globalAlpha = Math.min(1, ctx.globalAlpha + 0.22);
        ctx.fillRect(x, top, paneWidth, 3);
        ctx.globalAlpha = 1;
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
  { key: "slab", out: 140, side: 18, width: 64, depth: 26, yaw: 0.12, floors: 32, crown: true },
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
  { key: "deck", out: 168, side: -12, width: 52, depth: 42, chamfer: 3, floors: 17, mech: 3 },
  { key: "block", out: 176, side: 44, width: 38, depth: 34, chamfer: 3, floors: 22 },
  { key: "court", out: 218, side: 30, width: 44, depth: 38, floors: 14, mech: 2 },
  {
    key: "crest",
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
  { key: "twin-a", out: 246, side: 70, width: 28, depth: 26, chamfer: 3, floors: 36, crown: true },
  { key: "stack", out: 254, side: -84, width: 36, depth: 34, floors: 30 },
  { key: "twin-b", out: 262, side: 92, width: 28, depth: 26, chamfer: 3, floors: 32, crown: true },
  { key: "terrace", out: 296, side: -40, width: 50, depth: 42, floors: 20, mech: 2 },

  // The banks behind the haze. Lower and broader: detail here is spent on nothing.
  { key: "ridge", out: 330, side: 108, width: 42, depth: 36, chamfer: 3, floors: 34 },
  { key: "bar", out: 352, side: -128, width: 50, depth: 32, yaw: -0.1, floors: 26 },
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
  { key: "mass", out: 392, side: -56, width: 44, depth: 40, chamfer: 4, floors: 30 },
  { key: "plate", out: 428, side: 168, width: 46, depth: 34, floors: 24 },
  { key: "col", out: 452, side: -198, width: 32, depth: 30, chamfer: 3, floors: 38, crown: true },
  { key: "far-a", out: 482, side: 60, width: 38, depth: 34, floors: 28 },
  { key: "far-b", out: 512, side: -92, width: 42, depth: 36, chamfer: 3, floors: 32 },
  { key: "far-c", out: 538, side: 214, width: 36, depth: 32, floors: 26 },
  { key: "far-d", out: 566, side: -252, width: 40, depth: 36, floors: 22 },
  { key: "far-e", out: 592, side: 138, width: 46, depth: 38, chamfer: 3, floors: 34 },
  { key: "far-f", out: 618, side: -18, width: 42, depth: 36, floors: 28 },
  { key: "far-g", out: 646, side: -160, width: 48, depth: 40, floors: 24 },

  // The flanks. A camera anywhere but square-on to the glass looks out along the wall rather
  // than through it, and every one of those sightlines used to leave the window on bare haze.
  {
    flank: true,
    key: "flank-a",
    out: 118,
    side: -112,
    width: 34,
    depth: 30,
    chamfer: 4,
    floors: 34,
    crown: true,
  },
  { flank: true, key: "flank-b", out: 196, side: -184, width: 40, depth: 34, floors: 28 },
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
    out: 152,
    side: 128,
    width: 32,
    depth: 30,
    chamfer: 3,
    floors: 30,
  },
  { flank: true, key: "flank-f", out: 268, side: 236, width: 42, depth: 36, floors: 26 },
];

/** Which towers carry an aviation light. Only the tall ones do, and it is red, and it is small. */
const BEACON_TOWERS = new Set(["spire", "pin", "crest", "needle"]);
const BEACON_COLOR = "#ff5545";
const BEACON_SIZE = 1.1;

const CROWN_HEIGHT = 1.2;
/** Bright enough to catch the bloom, dark enough that the band never reads as a white lid. */
const CROWN_COLOR = "#5b7f95";
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
  rgb: readonly [number, number, number],
): void {
  const first = target.positions.length / 3;
  const corners: readonly (readonly [Corner, number])[] = [
    [bottom[0], bottom[1]],
    [bottom[2], bottom[3]],
    [top[2], top[3]],
    [top[0], top[1]],
  ];
  for (const [corner, y] of corners) {
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
  /** The ring and height the shaft finished on: what everything above it stands on. */
  topRing: readonly Corner[];
  topY: number;
};

/** The shaft: every segment's four-to-eight walls, and the cap that closes each one. */
function pushShaft(city: Buffers, tower: Tower, uOffset: number, vOffset: number): Tower {
  const { spec, center, yaw, tone } = tower;
  const footprint = chamferedRect(spec.width, spec.depth, spec.chamfer ?? 0);
  let topRing = tower.topRing;
  let topY = tower.topY;

  for (const segment of segmentsOf(spec)) {
    const bottom = scaleRing(footprint, segment.bottom, yaw);
    const top = scaleRing(footprint, segment.top, yaw);
    const v0 = (segment.y0 - STREET_Y) / TILE_RISE + vOffset;
    const v1 = (segment.y1 - STREET_Y) / TILE_RISE + vOffset;

    let run = uOffset;
    for (const { a, b, aTop, bTop } of wallsBetween(bottom, top)) {
      const u1 = run + (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1) / TILE_SPAN;
      pushQuadTapered(
        city.facades,
        center,
        [a, segment.y0, b, segment.y0],
        [aTop, segment.y1, bTop, segment.y1],
        [run, v0, u1, v1],
        rgbOf(GLASS_TONE, edgeShade(a, b) * tone),
      );
      run = u1;
    }

    pushCap(city.roofs, center, top, segment.y1, rgbOf(ROOF_COLOR, tone));
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
function pushCrown(city: Buffers, tower: Tower): void {
  const { spec, center, tone, topRing, topY } = tower;

  if (spec.crown) {
    const band = scaleRing(topRing, 1.012, 0);
    pushBand(city.crowns, center, band, topY - CROWN_HEIGHT, topY, rgbOf(CROWN_COLOR, 1));
    return;
  }

  const kerb = scaleRing(topRing, 1.01, 0);
  pushBand(city.roofs, center, kerb, topY, topY + ROOF_KERB, rgbOf(ROOF_COLOR, 1.6 * tone));
  pushCap(city.roofs, center, kerb, topY + ROOF_KERB, rgbOf(ROOF_COLOR, 0.8 * tone));
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
    roofs: buffer(),
    crowns: buffer(),
    beacons: buffer(),
  };

  for (const spec of CITY_TOWERS) {
    const yaw = spec.yaw ?? 0;
    const base: Tower = {
      spec,
      center: [ROOM.minX - spec.out, CITY_WINDOW.centerZ + spec.side],
      yaw,
      // Enough spread that no two shafts are the same value, not enough to read as a palette.
      tone: 0.82 + rand() * 0.18,
      topRing: scaleRing(chamferedRect(spec.width, spec.depth, spec.chamfer ?? 0), 1, yaw),
      topY: STREET_Y,
    };
    // Two towers reading the sheet from the same place would be the same building.
    const tower = pushShaft(city, base, rand(), rand());

    pushCrown(city, tower);
    pushMast(city, tower);
    pushRoofPlant(city, tower, rand);
  }

  return {
    facades: toGeometry(city.facades, true),
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
  const sky = useDisposable(() => createSkyTexture());
  const haze = useDisposable(() => createHazeTexture());
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
        <mesh geometry={city.roofs}>
          <meshBasicMaterial vertexColors toneMapped={false} fog={false} />
        </mesh>
        <mesh geometry={city.crowns}>
          <meshBasicMaterial vertexColors toneMapped={false} fog={false} />
        </mesh>
        <mesh geometry={city.beacons}>
          <meshBasicMaterial vertexColors toneMapped={false} fog={false} />
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

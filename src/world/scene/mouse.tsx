"use client";

import { type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";
import type { BufferGeometry } from "three";
import { Color, Float32BufferAttribute, Vector3 } from "three";
import { useDisposable } from "../gpu";
import { createShell, sampleCurve, smoothStep, type Knot, type Sheet } from "./shell";
import { worldColors } from "../materials";
import { DESK_TOP_Y } from "../room";

/**
 * The wired gaming mouse beside the keyboard, modeled the way the real one is molded:
 * separate shells that meet at real gaps, rather than one closed surface with the seams
 * painted onto it.
 *
 * That distinction is the whole file. Earlier attempts lofted a single superellipsoid and
 * drew the cut lines on as thin dark ribbons, and every one of them read as a lozenge with
 * decals — because on this object the parting lines *are* the shape. So the body is one
 * piece whose top is recessed under the front half, the two click wings are separate solids
 * with walls that drop into that recess, and the channel between them is air. The lit strip
 * is not a skirt around the base either: it is the seam between the upper shell and the grip
 * panel, so it arcs up the flank on its own because the silhouette it follows does.
 *
 * Everything is built from one primitive — `createShell` in `scene/shell.ts`, which skins a
 * list of parametric sheets into a single indexed geometry. Normals are computed per
 * geometry, so a sheet is smooth inside itself and every sheet boundary is a hard edge.
 * Picking where the sheets end is therefore how this file spells "crease", and it needs no
 * seam meshes at all.
 *
 * Three things in the photographs are deliberately not here. The braided cable is left off
 * because nothing else in this room is wired — keyboard, headphones and monitors all run
 * without one, so a single cable would read as the mistake rather than as the rule. The
 * etched palm logo and the hexagon grip texture are left off because this is 12 cm of a room
 * seen from across it: both land under a pixel, and both cost a texture to say nothing.
 *
 * Deliberately not merged with `keyboard.tsx`: two objects, two geometries, two lifecycles.
 */

/** In meters, off a full-size gaming mouse: 12.5 cm long, 7 across, 4.3 at the crest. */
export const MOUSE = { length: 0.125, width: 0.07, height: 0.043 } as const;

/**
 * The plan: half-width down the body as a fraction of the widest point, with `t` running
 * 0 at the nose to 1 at the tail. Two features carry the recognition. The nose reaches
 * nearly full width within 4 mm, which is what turns the front corners into the swept
 * points the wings are built on; and the widest point sits at 0.74 rather than the middle,
 * under the heel of the hand. Neither end reaches zero — a knife edge there would leave
 * degenerate triangles with no normal to compute.
 */
const PLAN: readonly Knot[] = [
  [0.0, 0.46],
  [0.016, 0.56],
  [0.05, 0.72],
  [0.1, 0.76],
  [0.24, 0.765],
  [0.38, 0.8],
  [0.52, 0.87],
  [0.64, 0.945],
  [0.75, 1.0],
  [0.85, 0.985],
  [0.92, 0.91],
  [0.96, 0.79],
  [0.985, 0.55],
  [1.0, 0.12],
];

/**
 * The side view — the height of the shoulder, where the top surface turns down into the
 * flank. This is the silhouette, and the lit strip and the whole grip panel hang off it.
 */
const PROFILE: readonly Knot[] = [
  [0.0, 0.16],
  [0.02, 0.24],
  [0.06, 0.36],
  [0.12, 0.45],
  [0.26, 0.56],
  [0.42, 0.69],
  [0.56, 0.785],
  [0.68, 0.82],
  [0.8, 0.76],
  [0.9, 0.58],
  [0.96, 0.36],
  [1.0, 0.17],
];

/** How far the crown stands above the shoulder on the centerline. */
const CROWN: readonly Knot[] = [
  [0.0, 0.05],
  [0.1, 0.085],
  [0.3, 0.115],
  [0.55, 0.15],
  [0.7, 0.155],
  [0.85, 0.13],
  [1.0, 0.05],
];

/**
 * The cross-section: flat across the middle, then rolling over hard near the flank. A plain
 * ellipse (both of these at 2) is what makes a shell read as a computer mouse from 1998.
 */
const CROWN_POWER = 5.0;
const CROWN_FALLOFF = 3.0;

/**
 * The flank, as a width multiplier against the height fraction it sits at: a shallow barrel
 * through the middle, tucking back in at the bottom so the base reads as a chamfered skirt
 * standing on the desk rather than as a wall meeting it.
 */
const FLANK: readonly Knot[] = [
  [0.0, 0.86],
  [0.05, 0.96],
  [0.14, 0.995],
  [0.5, 1.006],
  [1.0, 1.0],
];

export function halfWidthAt(t: number): number {
  return (MOUSE.width / 2) * sampleCurve(PLAN, t);
}

export function shoulderAt(t: number): number {
  return MOUSE.height * sampleCurve(PROFILE, t);
}

function crownAt(across: number): number {
  const clamped = Math.min(Math.abs(across), 1);
  return (1 - clamped ** CROWN_POWER) ** (1 / CROWN_FALLOFF);
}

function alongAt(t: number): number {
  return (t - 0.5) * MOUSE.length;
}

/** The unbroken outer surface: what the wings sit on, before the body is cut away under them. */
export function shellTopAt(t: number, across: number): number {
  return shoulderAt(t) + MOUSE.height * sampleCurve(CROWN, t) * crownAt(across);
}

function flankAt(t: number, height: number, side: number): Vector3 {
  return new Vector3(
    side * halfWidthAt(t) * sampleCurve(FLANK, height),
    shoulderAt(t) * height,
    alongAt(t),
  );
}

/**
 * The two click wings: their footprint, and the air around them.
 *
 * The front edge is swept — the inner corner starts 9 mm back from the outer one — which is
 * the notch the wheel housing sits in and the reason the front corners read as points. The
 * rear edge is swept the other way, so each wing runs further back at the flank than on the
 * centerline, and the palm shell wraps around it.
 */
export const WING = {
  frontInner: 0.055,
  frontOuter: 0.006,
  backInner: 0.47,
  backOuter: 0.55,
  /** How far a wing's walls drop. They end inside the body; nothing ever sees the underside. */
  depth: 0.0068,
  /** How far the body's top is cut away under one, so the wing lands flush instead of on top. */
  recess: 0.003,
  /** The deck ahead of the wings — the housing the wheel sits in — sits just under their faces. */
  deck: 0.0013,
} as const;
/**
 * The rebate between a wing's outer edge and the body's shoulder. It closes to a hairline
 * at the nose: the body is only a few millimeters wide there, and a full-width rebate turns
 * the front of the mouse into two fins with daylight behind them.
 */
function edgeGrooveAt(t: number): number {
  return 0.0004 + 0.0009 * smoothStep(0.02, 0.18, t);
}

/** The channel down the middle, in meters: a hairline, opened out for the wheel and the DPI pair. */
const CHANNEL: readonly Knot[] = [
  [0.0, 0.001],
  [0.035, 0.0011],
  [0.05, 0.0044],
  [0.245, 0.0044],
  [0.265, 0.0026],
  [0.42, 0.0026],
  [0.45, 0.0012],
  [0.6, 0.0012],
];

function channelHalfAt(t: number): number {
  return sampleCurve(CHANNEL, t);
}

/**
 * The front edge, swept back hard toward the centerline: the inner corners of the two wings
 * stop 7 mm behind the outer ones, and the ridge left standing between them is the housing
 * the wheel is set into.
 */
function wingFrontAt(across: number): number {
  const outward = Math.min(Math.abs(across), 1);
  const eased = outward * outward * (3 - 2 * outward);
  return WING.frontInner + (WING.frontOuter - WING.frontInner) * eased;
}

/** Swept, and eased toward the flank so the palm shell meets the wings on an arc, not a chevron. */
function wingBackAt(across: number): number {
  const outward = Math.min(Math.abs(across), 1) ** 0.65;
  return WING.backInner + (WING.backOuter - WING.backInner) * outward;
}

/**
 * How far the body's top is cut away: the wing's own thickness under a wing, and much more
 * again under the wheel, because a wheel that only has to clear a 3 mm recess is a wheel with
 * a 6 mm diameter.
 */
const WELL = 0.005;

function recessAt(t: number, across: number): number {
  const front = wingFrontAt(across);
  const back = wingBackAt(across);
  // Both ramps are deliberately gentle. The crisp line at either end of a wing is the wing's
  // own wall, which is a sheet of its own at its own resolution; asking the body's grid to
  // hold a 1 mm step instead just puts a staircase across the shell.
  const started = smoothStep(front - 0.018, front + 0.012, t);
  const underWing = started * (1 - smoothStep(back, back + 0.03, t));
  const underWheel = smoothStep(0.06, 0.09, t) * (1 - smoothStep(0.24, 0.28, t));

  return underWing * (WING.recess + WELL * underWheel) + (1 - started) * WING.deck;
}

export function bodyTopAt(t: number, across: number): number {
  return shellTopAt(t, across) - recessAt(t, across);
}

const LENGTH_ROWS = 150;
const ACROSS_COLUMNS = 60;

/** Where the two lamps under the strip sit, in meters from the middle of the body. */
const SPILL = [-0.04, 0.04] as const;

/** Where the lit seam sits on the flank, as a fraction of the shoulder height. */
const SEAM_AT = 0.5;
const SEAM_HALF = 0.022;
const SEAM_TOP = SEAM_AT + SEAM_HALF;
const SEAM_BOTTOM = SEAM_AT - SEAM_HALF;
const BASE_INSET = 0.86;
const BASE_Y = 0.0004;

const SIDES = [-1, 1] as const;

/** The palm shell: the cut-away top, and the flank above the lit seam. */
function bodySheets(): readonly Sheet[] {
  return [
    {
      rows: LENGTH_ROWS,
      columns: ACROSS_COLUMNS,
      clusterRows: true,
      clusterColumns: true,
      point: (u, v) => {
        const across = 1 - v * 2;
        return new Vector3(across * halfWidthAt(u), bodyTopAt(u, across), alongAt(u));
      },
    },
    ...SIDES.map((side) => ({
      rows: LENGTH_ROWS,
      columns: 5,
      clusterRows: true,
      point: (u: number, v: number) =>
        flankAt(u, SEAM_TOP + (1 - SEAM_TOP) * (side > 0 ? v : 1 - v), side),
    })),
  ];
}

/**
 * The two ends. Neither is a point: the shell is cut off square at the nose and rounded off
 * at the tail, and a plan that closed to a knife edge at either end left a bright fin
 * standing out in front of the body instead of a face on it.
 */
function capSheets(): readonly Sheet[] {
  return SIDES.map((side) => {
    const t = side < 0 ? 0 : 1;
    return {
      rows: 26,
      columns: 7,
      clusterColumns: true,
      point: (u: number, v: number) => {
        const across = (side < 0 ? u : 1 - u) * 2 - 1;
        return new Vector3(
          across * halfWidthAt(t) * sampleCurve(FLANK, v),
          bodyTopAt(t, across) * v,
          alongAt(t),
        );
      },
    };
  });
}

/** The grip panel below the seam, and the base plate it stands on. */
export function gripSheets(): readonly Sheet[] {
  return [
    ...SIDES.map((side) => ({
      rows: LENGTH_ROWS,
      columns: 9,
      clusterRows: true,
      clusterColumns: true,
      point: (u: number, v: number) => flankAt(u, SEAM_BOTTOM * (side > 0 ? v : 1 - v), side),
    })),
    {
      rows: 48,
      columns: 8,
      clusterRows: true,
      point: (u: number, v: number) =>
        new Vector3((v * 2 - 1) * halfWidthAt(u) * BASE_INSET, BASE_Y, alongAt(u)),
    },
  ];
}

export function seamSheets(offset: number, spread: number): readonly Sheet[] {
  return SIDES.map((side) => ({
    rows: LENGTH_ROWS,
    columns: 2,
    clusterRows: true,
    point: (u: number, v: number) => {
      const height = SEAM_AT + SEAM_HALF * spread * ((side > 0 ? v : 1 - v) * 2 - 1);
      const at = flankAt(u, height, side);
      at.x += side * offset;
      return at;
    },
  }));
}

function wingSpanAt(across: number): { readonly from: number; readonly to: number } {
  return { from: wingFrontAt(across), to: wingBackAt(across) };
}

function wingPoint(side: number, u: number, across: number, drop: number): Vector3 {
  const span = wingSpanAt(across);
  const t = span.from + (span.to - span.from) * u;
  const inner = channelHalfAt(t);
  const outer = Math.max(inner + 0.001, halfWidthAt(t) - edgeGrooveAt(t));
  const x = inner + (outer - inner) * across;

  return new Vector3(side * x, shellTopAt(t, x / halfWidthAt(t)) - drop, alongAt(t));
}

/** One wing: the face, then the four walls that drop off its edges into the body. */
export function wingSheets(side: number): readonly Sheet[] {
  const outward = side > 0 ? 1 : -1;

  return [
    {
      rows: 44,
      columns: 30,
      clusterColumns: true,
      point: (u, v) => wingPoint(side, u, outward > 0 ? 1 - v : v, 0),
    },
    {
      rows: 44,
      columns: 3,
      point: (u, v) => wingPoint(side, outward > 0 ? u : 1 - u, 0, v * WING.depth),
    },
    {
      rows: 44,
      columns: 3,
      point: (u, v) => wingPoint(side, outward > 0 ? 1 - u : u, 1, v * WING.depth),
    },
    {
      rows: 30,
      columns: 3,
      clusterRows: true,
      point: (u, v) => wingPoint(side, 0, outward > 0 ? 1 - u : u, v * WING.depth),
    },
    {
      rows: 30,
      columns: 3,
      clusterRows: true,
      point: (u, v) => wingPoint(side, 1, outward > 0 ? u : 1 - u, v * WING.depth),
    },
  ];
}

/**
 * The strip is the room's one accent, the same cyan the keyboard and the headphones are lit
 * with —
 * this is a desk of matching parts, not the object that gets a palette of its own.
 *
 * The color is painted onto the vertices anyway rather than set on the material, because what
 * varies along the strip is its *brightness*: both flanks converge on the centerline at the
 * nose and the tail, so a strip carried all the way there stacks into a bright bead on an
 * object with no light source at either end. A fade is a vertex attribute or a texture, and
 * this one is a few hundred vertices of a shape that already exists.
 */
export function paintSeam(geometry: BufferGeometry): BufferGeometry {
  const position = geometry.getAttribute("position");
  const lit = new Color(worldColors.accent);
  const shade = new Color();
  const colors: number[] = [];

  for (let index = 0; index < position.count; index += 1) {
    const along = position.getZ(index) / MOUSE.length + 0.5;
    const ends = smoothStep(0.02, 0.1, along) * (1 - smoothStep(0.93, 0.995, along));
    shade.copy(lit).multiplyScalar(ends);
    colors.push(shade.r, shade.g, shade.b);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

  return geometry;
}

/**
 * The wheel, in meters rather than in body parameters — it is a machined part set into this
 * surface, not a feature of it. The lit core is a hair wider than the rubber, so what shows
 * above the slot is a dark tire with a lit rim on each side of it.
 */
export const WHEEL = {
  t: 0.145,
  radius: 0.0066,
  width: 0.0064,
  glowRadius: 0.0054,
  glowWidth: 0.0072,
  rise: 0.0034,
} as const;

/** The two DPI buttons behind the wheel, and the two thumb buttons on the left flank. */
const DPI_BUTTONS = [0.3, 0.375] as const;
const DPI_SIZE = { width: 0.0042, height: 0.0022, length: 0.0062 } as const;
const THUMB_BUTTONS = [0.27, 0.4] as const;
const THUMB_SIZE = { thickness: 0.0022, height: 0.003, length: 0.013 } as const;
const THUMB_AT = 0.72;
const THUMB_SIDE = -1;

function thumbPlacement(t: number): {
  readonly position: Vector3;
  readonly turn: number;
} {
  const ahead = flankAt(t + 0.01, THUMB_AT, THUMB_SIDE);
  const behind = flankAt(t - 0.01, THUMB_AT, THUMB_SIDE);
  const position = flankAt(t, THUMB_AT, THUMB_SIDE);
  position.x += THUMB_SIDE * 0.0005;

  return { position, turn: Math.atan2(ahead.x - behind.x, ahead.z - behind.z) };
}

/** Every sheet the matte shell is made of: the body, its two end caps, and both wings. */
export function shellSheets(): readonly Sheet[] {
  return [...bodySheets(), ...capSheets(), ...wingSheets(1), ...wingSheets(-1)];
}

const SHELL_MATERIAL = { color: "#161c24", roughness: 0.62, metalness: 0.22 } as const;
const GRIP_MATERIAL = { color: "#0c1218", roughness: 0.95, metalness: 0.05 } as const;
const BUTTON_MATERIAL = { color: "#12181f", roughness: 0.38, metalness: 0.4 } as const;
const WHEEL_MATERIAL = { color: "#06090d", roughness: 0.88, metalness: 0.08 } as const;

function MouseBody(): ReactElement {
  const parts = useDisposable(() => ({
    shell: createShell(shellSheets()),
    grip: createShell(gripSheets()),
  }));

  return (
    <>
      <mesh geometry={parts.shell}>
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </mesh>
      <mesh geometry={parts.grip}>
        <meshStandardMaterial {...GRIP_MATERIAL} />
      </mesh>
    </>
  );
}

function MouseControls(): ReactElement {
  const wheel = useDisposable(() => ({
    center: new Vector3(0, shellTopAt(WHEEL.t, 0) + WHEEL.rise - WHEEL.radius, alongAt(WHEEL.t)),
  }));

  return (
    <>
      <mesh position={wheel.center} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[WHEEL.radius, WHEEL.radius, WHEEL.width, 28]} />
        <meshStandardMaterial {...WHEEL_MATERIAL} />
      </mesh>
      <mesh position={wheel.center} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[WHEEL.glowRadius, WHEEL.glowRadius, WHEEL.glowWidth, 28]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      {DPI_BUTTONS.map((t) => (
        <mesh
          key={t}
          position={[0, bodyTopAt(t, 0) + DPI_SIZE.height, alongAt(t)]}
          rotation={[0.06, 0, 0]}
        >
          <boxGeometry args={[DPI_SIZE.width, DPI_SIZE.height, DPI_SIZE.length]} />
          <meshStandardMaterial {...BUTTON_MATERIAL} />
        </mesh>
      ))}
      {THUMB_BUTTONS.map((t) => {
        const { position, turn } = thumbPlacement(t);
        return (
          <mesh key={t} position={position} rotation={[0, turn, 0]}>
            <boxGeometry args={[THUMB_SIZE.thickness, THUMB_SIZE.height, THUMB_SIZE.length]} />
            <meshStandardMaterial {...BUTTON_MATERIAL} />
          </mesh>
        );
      })}
    </>
  );
}

function MouseGlow(): ReactElement {
  const bands = useDisposable(() => ({
    seam: paintSeam(createShell(seamSheets(0, 1))),
    halo: paintSeam(createShell(seamSheets(0.0009, 2.4))),
  }));

  return (
    <>
      <mesh geometry={bands.seam}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
      <mesh geometry={bands.halo}>
        <meshBasicMaterial
          vertexColors
          toneMapped={false}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
      {/*
        The spill the strip throws onto the desk, one lamp per end so the pool follows the
        body rather than sitting under its middle. Kept tighter than the body: a pool wider
        than the mouse is the whole read of the object from across the room, and it stops
        looking like light coming off it and starts looking like something it floats on.
      */}
      {SPILL.map((z) => (
        <pointLight
          key={z}
          position={[0, 0.004, z]}
          intensity={0.05}
          distance={0.105}
          decay={2}
          color={worldColors.accent}
        />
      ))}
    </>
  );
}

/**
 * Right of the keyboard, which ends at x ≈ 0.32, and short of the mug at 0.78 — and sitting
 * nearer the front of the desk than either, so the two never crowd each other in plan.
 */
const MOUSE_POSITION = [0.57, DESK_TOP_Y, 0.34] as const;

export function Mouse(): ReactElement {
  return (
    <group position={MOUSE_POSITION} rotation={[0, -0.09, 0]}>
      <MouseBody />
      <MouseControls />
      <MouseGlow />
      <ContactShadows
        position={[0, 0.0008, 0]}
        scale={0.3}
        resolution={256}
        blur={1.8}
        far={0.06}
        opacity={0.6}
        color="#01050a"
        frames={1}
      />
    </group>
  );
}

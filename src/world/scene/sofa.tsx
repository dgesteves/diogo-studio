"use client";

import { type ReactElement } from "react";
import { Instance, Instances } from "@react-three/drei";
import { Vector3, type BufferGeometry } from "three";
import { useDisposable } from "../gpu";
import { frameMaterial } from "../materials";
import { type Vec3 } from "../stations";
import { createShell, type Sheet } from "./shell";

/**
 * The lounge's sectional: three seat modules in a run, a chaise turning the corner at the wall
 * end, and the back rail returning as an arm at the other. Modeled from a photograph of a grey
 * modular sofa, mirrored — the reference's chaise is on the right as you face it, which in this
 * room would stand between the `openSource` camera and the television. It reads as the other
 * handedness of the same piece.
 *
 * **A sectional is not a stack of boxes.** What makes one recognizable is that every part of
 * it is a slab of foam under fabric: the top edges roll over through a radius a third of the
 * cushion's own height, the sides barrel out where nothing compresses them, and the modules
 * stand apart with a real gap of shadow between them. A `RoundedBox` says none of that — one
 * radius rounds all twelve edges alike, so a seat cushion comes out as hard at the roll as it
 * is at the floor, and the run reads as a bench with lines painted on it. That was the sofa
 * this one replaced.
 *
 * So the only shape here is `Cushion`: a rounded box whose plan radius, top-and-bottom roll
 * and mid-height bulge are three separate numbers, skinned as a swept outline with two caps.
 * Fourteen of them share one geometry and one draw call, the way `scene/books.tsx` merges a
 * shelf. The measurements below are a real sectional's: 3.1 m along the wall, a 1.5 m chaise,
 * seats at 42 cm and backs at 64 cm.
 *
 * Those three are read back off the finished blocks rather than written down — see `SOFA`. The
 * bulge carries the surface a centimeter past the box every block is written with, and the
 * lounge measures the room's clearances against the surface.
 */

/* ------------------------------------------------------------------ the cushion */

/** A soft upholstered block, in the sofa's own frame: back face at `z = 0`, front at `-z`. */
export type Cushion = {
  /** The center of the block before the roll and the bulge move its surface. */
  readonly center: Vec3;
  /** Width across the run, height, depth front to back. */
  readonly size: Vec3;
  /** The four vertical edges, seen in plan. */
  readonly planRadius: number;
  /** The roll over the top face. A seat cushion is nearly all roll. */
  readonly rollRadius: number;
  /**
   * The roll over the bottom face, where it differs. Every block here stands on another one,
   * and a block rolled as softly underneath as on top pinches into a waist at the join — two
   * pillows stacked rather than one upholstered mass.
   */
  readonly bottomRoll?: number;
  /** How far the sides barrel out at mid-height. Foam under fabric is never flat. */
  readonly bulge: number;
};

/**
 * A run of the outline, and the share of the sweep's `v` it is given. Arc length would starve
 * the corners — on a 64 cm cushion the four of them are a fifth of the perimeter and would
 * come out three samples each — so the corners are weighted instead. The straights need
 * almost nothing: the bulge moves a whole side outward together, so a side stays flat.
 */
const CORNER_SHARE = 3;
const EDGE_SHARE = 1;

type Run = { readonly share: number; readonly at: (t: number) => readonly [number, number] };

function arcRun(centerX: number, centerZ: number, radius: number, from: number): Run {
  return {
    share: CORNER_SHARE,
    at: (t) => {
      const angle = from - (t * Math.PI) / 2;
      return [centerX + Math.cos(angle) * radius, centerZ + Math.sin(angle) * radius];
    },
  };
}

function lineRun(
  share: number,
  from: readonly [number, number],
  to: readonly [number, number],
): Run {
  return {
    share,
    at: (t) => [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t],
  };
}

/**
 * The outline of one horizontal section, walked counter-clockwise seen from above and
 * starting at the middle of the back face. Both ends of the walk have to land on the same
 * point, and `createShell` leaves a seam there with split normals — put on a flat face, where
 * the normals either side are identical, that seam is invisible. Put on a corner it is a
 * crease down the front of the sofa.
 */
function outlineRuns(halfX: number, halfZ: number, planRadius: number): readonly Run[] {
  const radius = Math.max(0, Math.min(planRadius, halfX, halfZ));
  const x = halfX - radius;
  const z = halfZ - radius;

  return [
    lineRun(EDGE_SHARE / 2, [0, halfZ], [x, halfZ]),
    arcRun(x, z, radius, Math.PI / 2),
    lineRun(EDGE_SHARE, [halfX, z], [halfX, -z]),
    arcRun(x, -z, radius, 0),
    lineRun(EDGE_SHARE, [x, -halfZ], [-x, -halfZ]),
    arcRun(-x, -z, radius, -Math.PI / 2),
    lineRun(EDGE_SHARE, [-halfX, -z], [-halfX, z]),
    arcRun(-x, z, radius, -Math.PI),
    lineRun(EDGE_SHARE / 2, [-x, halfZ], [0, halfZ]),
  ];
}

function outlinePoint(runs: readonly Run[], v: number): readonly [number, number] {
  const total = runs.reduce((sum, run) => sum + run.share, 0);
  let traveled = v * total;
  // `end` closes the walk: at `v = 1` rounding can leave a sliver of `traveled` unspent,
  // and the outline has to come back to the point it started from or the sweep leaves a slot.
  let end: readonly [number, number] = [0, 0];
  for (const run of runs) {
    if (traveled <= run.share) return run.at(traveled / run.share);
    traveled -= run.share;
    end = run.at(1);
  }
  return end;
}

/**
 * The section at one height: the roll pulls it in near the top and bottom faces, the bulge
 * pushes it out in the middle. Both act on the half-extents rather than on the finished
 * point, which is what keeps a flat side flat and a rolled edge circular.
 */
function sectionAt(cushion: Cushion, y: number): readonly Run[] {
  const halfHeight = cushion.size[1] / 2;
  const roll = Math.min(
    y >= 0 ? cushion.rollRadius : (cushion.bottomRoll ?? cushion.rollRadius),
    halfHeight,
  );
  const fromEnd = halfHeight - Math.abs(y);
  const inset =
    fromEnd >= roll ? 0 : roll - Math.sqrt(Math.max(0, roll * roll - (roll - fromEnd) ** 2));
  const push = cushion.bulge * (1 - (y / halfHeight) ** 2);

  return outlineRuns(
    cushion.size[0] / 2 - inset + push,
    cushion.size[2] / 2 - inset + push,
    cushion.planRadius,
  );
}

function placed(cushion: Cushion, x: number, y: number, z: number): Vector3 {
  return new Vector3(cushion.center[0] + x, cushion.center[1] + y, cushion.center[2] + z);
}

/** Enough to hold a roll without banding, and no more: fourteen of these share one geometry. */
const WRAP_ROWS = 14;
const CAP_ROWS = 4;
const OUTLINE_COLUMNS = 40;

/**
 * Three sheets: the swept side, and a flat cap at each end. The cap meets the side where the
 * roll has already turned horizontal, so the hard edge `createShell` leaves between two
 * sheets falls between two normals that already agree and never shows.
 */
export function cushionSheets(cushion: Cushion): readonly Sheet[] {
  const halfHeight = cushion.size[1] / 2;

  const side: Sheet = {
    rows: WRAP_ROWS,
    columns: OUTLINE_COLUMNS,
    // The rolls are at both ends of the height, which is exactly where cosine spacing bunches.
    clusterRows: true,
    point: (u, v) => {
      const y = -halfHeight + u * cushion.size[1];
      const [x, z] = outlinePoint(sectionAt(cushion, y), v);
      return placed(cushion, x, y, z);
    },
  };

  // The top runs rim to center and the bottom center to rim: `createShell` takes its winding
  // from u × v, so the two caps have to be swept opposite ways to both face outward.
  const cap = (top: boolean): Sheet => ({
    rows: CAP_ROWS,
    columns: OUTLINE_COLUMNS,
    point: (u, v) => {
      const y = top ? halfHeight : -halfHeight;
      const reach = top ? 1 - u : u;
      const [x, z] = outlinePoint(sectionAt(cushion, y), v);
      return placed(cushion, x * reach, y, z * reach);
    },
  });

  return [side, cap(true), cap(false)];
}

/* ------------------------------------------------------------------ the sectional */

const GAP = 0.016;

/** Left to right along the wall. The chaise is last because it is the end against the wall. */
const MODULES = [
  { width: 0.2, kind: "arm" },
  { width: 0.64, kind: "seat" },
  { width: 0.64, kind: "seat" },
  { width: 0.64, kind: "seat" },
  { width: 0.92, kind: "chaise" },
] as const;

const FOOT = { height: 0.035, radius: 0.022, inset: 0.1 } as const;
const BASE = { height: 0.2 } as const;
const SEAT = { height: 0.18, back: -0.3 } as const;
const BACK = { height: 0.4, front: -0.29 } as const;

const RUN_DEPTH = 0.94;
const CHAISE_DEPTH = 1.48;
/** The return at the far end: the back rail turning the corner rather than a separate arm. */
const ARM_DEPTH = 0.52;
/** The chaise's outer arm, against the wall. */
const CHAISE_ARM_WIDTH = 0.18;

const BASE_BOTTOM = FOOT.height;
const BASE_TOP = BASE_BOTTOM + BASE.height;
const SEAT_TOP = BASE_TOP + SEAT.height;
const BACK_TOP = BASE_TOP + BACK.height;
const NOMINAL_WIDTH =
  MODULES.reduce((sum, unit) => sum + unit.width, 0) + GAP * (MODULES.length - 1);

const SOFT = { planRadius: 0.05, rollRadius: 0.07, bottomRoll: 0.02, bulge: 0.01 } as const;
const PLUMP = { planRadius: 0.04, rollRadius: 0.1, bottomRoll: 0.02, bulge: 0.01 } as const;
const FIRM = { planRadius: 0.02, rollRadius: 0.022, bottomRoll: 0.012, bulge: 0.004 } as const;
const ARM = { planRadius: 0.04, rollRadius: 0.09, bottomRoll: 0.02, bulge: 0.008 } as const;

type Module = (typeof MODULES)[number];

function moduleDepth(unit: Module): number {
  if (unit.kind === "chaise") return CHAISE_DEPTH;
  if (unit.kind === "arm") return ARM_DEPTH;
  return RUN_DEPTH;
}

/** How soft one block is. Four of these are the whole vocabulary the sectional is upholstered in. */
type Foam = {
  planRadius: number;
  rollRadius: number;
  bottomRoll: number;
  bulge: number;
};

/** A block given by the span it fills rather than by a center, which is how it was measured. */
function block(
  x: number,
  width: number,
  bottom: number,
  height: number,
  back: number,
  front: number,
  foam: Foam,
): Cushion {
  return {
    center: [x, bottom + height / 2, (back + front) / 2],
    size: [width, height, back - front],
    ...foam,
  };
}

function moduleCushions(unit: Module, x: number): readonly Cushion[] {
  const depth = moduleDepth(unit);

  // The far end is one block floor to back, not a plinth with a cushion on it: it is the back
  // rail turning the corner, and a seam across it reads as a stool someone left a pillow on.
  if (unit.kind === "arm") {
    const height = BACK_TOP - BASE_BOTTOM;
    return [block(x, unit.width, BASE_BOTTOM, height, 0, -depth, ARM)];
  }

  const base = block(x, unit.width, BASE_BOTTOM, BASE.height, 0, -depth, FIRM);

  // The chaise carries its back over the seat's rear half only; the seat runs on past it,
  // which is the whole point of a chaise and the one place the run's own depths do not apply.
  const chaise = unit.kind === "chaise";
  const seatWidth = chaise ? unit.width - CHAISE_ARM_WIDTH - GAP : unit.width;
  const seatX = chaise ? x - (CHAISE_ARM_WIDTH + GAP) / 2 : x;

  return [
    base,
    block(seatX, seatWidth, BASE_TOP, SEAT.height, SEAT.back, -depth, SOFT),
    block(seatX, seatWidth, BASE_TOP, BACK.height, 0, BACK.front, PLUMP),
    ...(chaise
      ? [
          block(
            x + (unit.width - CHAISE_ARM_WIDTH) / 2,
            CHAISE_ARM_WIDTH,
            BASE_TOP,
            BACK.height,
            0,
            -depth,
            ARM,
          ),
        ]
      : []),
  ];
}

/**
 * Where one block's *surface* is, which is not where its box is: the bulge carries all four
 * sides out by its own amount at mid-height. The top and bottom are the two faces it leaves
 * alone — it falls to zero there, which is what keeps the roll circular where it meets a cap.
 */
function surfaceHalf(cushion: Cushion): Vec3 {
  return [
    cushion.size[0] / 2 + cushion.bulge,
    cushion.size[1] / 2,
    cushion.size[2] / 2 + cushion.bulge,
  ];
}

/**
 * Laid out left to right from one running edge, so the gaps are the only spacing there is,
 * then slid forward by its own overhang. The lounge places this piece by its back face and
 * measures the room's clearances from there, so "back face" has to mean the surface rather
 * than the box the surface was grown from — the back cushions bulge a centimeter past theirs.
 */
function layOut(): Layout {
  const cushions: Cushion[] = [];
  const feet: Vec3[] = [];
  let runReach = 0;
  let edge = -NOMINAL_WIDTH / 2;

  for (const unit of MODULES) {
    const x = edge + unit.width / 2;
    const depth = moduleDepth(unit);
    const blocks = moduleCushions(unit, x);
    cushions.push(...blocks);
    if (unit.kind === "seat") {
      runReach = Math.min(
        runReach,
        ...blocks.map((piece) => piece.center[2] - surfaceHalf(piece)[2]),
      );
    }

    const reach = unit.width / 2 - FOOT.inset;
    const acrossRun = reach > 0.05 ? [x - reach, x + reach] : [x];
    const alongRun =
      depth > 1
        ? [-FOOT.inset, -depth / 2, -depth + FOOT.inset]
        : [-FOOT.inset, -depth + FOOT.inset];
    for (const footX of acrossRun) {
      for (const footZ of alongRun) feet.push([footX, FOOT.height / 2, footZ]);
    }

    edge += unit.width + GAP;
  }

  const overhang = Math.max(
    ...cushions.map((cushion) => cushion.center[2] + surfaceHalf(cushion)[2]),
  );
  const slid = cushions.map((cushion): Cushion => ({
    ...cushion,
    center: [cushion.center[0], cushion.center[1], cushion.center[2] - overhang],
  }));

  return {
    cushions: slid,
    feet: feet.map(([x, y, z]): Vec3 => [x, y, z - overhang]),
    width: 2 * Math.max(...slid.map((block) => block.center[0] + surfaceHalf(block)[0])),
    depth: -Math.min(...slid.map((block) => block.center[2] - surfaceHalf(block)[2])),
    runDepth: overhang - runReach,
    backTop: Math.max(...slid.map((block) => block.center[1] + surfaceHalf(block)[1])),
  };
}

type Layout = {
  cushions: readonly Cushion[];
  feet: readonly Vec3[];
  width: number;
  /** The chaise: the deepest the piece reaches, and what the rug has to cover. */
  depth: number;
  /** The run of seats, which is what the coffee table's legroom is measured against. */
  runDepth: number;
  backTop: number;
};

const LAYOUT = layOut();

/**
 * The model, exported because it is the thing worth asserting: the finished mesh is one merged
 * geometry, and a chaise built on the wrong side of the run reads there as a plausible sofa.
 */
export const SOFA_BLOCKS = LAYOUT.cushions;
export const SOFA_FEET = LAYOUT.feet;

/**
 * What the lounge needs to place the piece and keep the room clear of it — measured off the
 * finished blocks rather than off the constants above, because the bulge carries every one of
 * these a centimeter past the boxes it was written with, and the clearances are read from them.
 */
export const SOFA = {
  width: LAYOUT.width,
  depth: LAYOUT.depth,
  runDepth: LAYOUT.runDepth,
  seatTop: SEAT_TOP,
  backTop: LAYOUT.backTop,
} as const;

/** One geometry for the whole piece — fourteen blocks, one draw call. */
export function createUpholstery(): BufferGeometry {
  return createShell(SOFA_BLOCKS.flatMap(cushionSheets));
}

/** Mid-grey, stepped down from the reference's daylit fabric the way the room's silver is:
 * a 2.9 m pale mass is exactly the area `world/postprocessing.tsx` blooms into a wash. */
const FABRIC = { color: "#454d56", roughness: 0.94, metalness: 0.02 } as const;

export function Sofa(): ReactElement {
  const upholstery = useDisposable(createUpholstery);

  return (
    <group>
      <mesh geometry={upholstery} castShadow receiveShadow>
        <meshStandardMaterial {...FABRIC} />
      </mesh>

      <Instances limit={SOFA_FEET.length} range={SOFA_FEET.length} frustumCulled={false}>
        <cylinderGeometry args={[FOOT.radius, FOOT.radius * 0.8, FOOT.height, 8]} />
        <meshStandardMaterial {...frameMaterial} />
        {SOFA_FEET.map((foot) => (
          <Instance key={foot.join(",")} position={foot} />
        ))}
      </Instances>
    </group>
  );
}

"use client";

import { type ReactElement } from "react";
import { DoubleSide, Vector3 } from "three";
import { useDisposable } from "../gpu";
import { createShell, sampleCurve, type Knot, type Sheet } from "./shell";

/**
 * The task chair at the desk: a mesh-back Aeron, modeled off the manufacturer's own turntable
 * renders and its glTF.
 *
 * What makes one recognizable is not the outline — every office chair is a back, a seat and a
 * star — but that **almost none of it is solid**. The back and the seat are woven panels
 * stretched inside two frames, so the room shows through both, and everything else is a thin
 * molded member: rails, a Y-strut, arm stems, five tapered legs. The chair the room had before
 * this one was four boxes, and the tell was that it read as a slab of furniture parked in front
 * of the desk rather than as a frame you can see the floor through.
 *
 * So there are only two kinds of part in here. A **panel** is a stretched surface — a sheet
 * dished the way woven fabric under tension actually is, drawn translucent. A **member** is a
 * cross-section carried along a path, which is every frame piece, every leg and both arms.
 * `sweepSheets` below is the whole vocabulary for the second kind; `createShell` in
 * `scene/shell.ts` skins both, and each part is one sheet list, so every joint between two
 * moldings is a hard edge for free.
 *
 * The measurements are in meters off the real chair, read out of the glTF part by part: 1.01 m
 * to the crown, a 0.68 m base, a seat that crowns at 0.52 and armpads 0.69 apart. Two of the
 * curves are worth reading before changing anything, because they are the whole silhouette —
 * the back's plan, which is widest at the shoulders rather than the waist, and the seat rail's
 * top edge, which arcs into a raised gunwale down each side instead of sitting flat.
 *
 * The woven texture of the panels is deliberately not here. It is a 1 mm weave on an object seen
 * from four meters across a dark room: every thread lands well under a pixel, so it would cost a
 * texture to say nothing, and a coarser one to make it visible would crawl on every camera move.
 * What has to survive at that distance is that the panels are *translucent*, and that is a
 * material rather than a texture. `scene/mouse.tsx` leaves its grip texture off for the same
 * reason.
 */

/** The chair, in meters: floor to crown, the base's spread, and the seat you sit on. */
export const AERON = {
  crownY: 1.014,
  /** The crown of the seat, under the thighs — the pan falls away 6 cm behind it. */
  seatY: 0.525,
  baseRadius: 0.34,
  armSpan: 0.694,
} as const;

/**
 * A cross-section carried along a path — the only solid in this file.
 *
 * `across` and `through` are the section's own axes at that point, already scaled to their
 * half-extents, so a member tapers by handing back shorter vectors rather than by a separate
 * width curve. The section itself is a superellipse: a molded frame member is a rounded
 * rectangle in section, and an ellipse there is what makes a chair frame read as bent tube.
 */
type Station = {
  readonly center: Vector3;
  readonly across: Vector3;
  readonly through: Vector3;
};

type Sweep = {
  readonly steps: number;
  readonly segments?: number;
  readonly at: (s: number) => Station;
  /**
   * How square the section is. Two is an ellipse, which is bent tube; the frame members on
   * this chair are moldings with a face and an edge, so they run higher than that.
   */
  readonly power?: number;
  /** A loop closes on itself and has no ends; a member is capped at both. */
  readonly capped?: boolean;
};

const SECTION_POWER = 3.6;
/**
 * Around the section. Twelve is chosen against the object rather than the shape: the widest
 * member on this chair is 5 cm, so a facet on one lands well inside a pixel from where the
 * room is seen — and this is the largest prop in it, so the count is worth spending carefully.
 * The armpads ask for more, because a pad is a broad rounded form rather than a rail.
 */
const SECTION_SEGMENTS = 12;

function sectionAt(station: Station, angle: number, radius: number, power: number): Vector3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return new Vector3()
    .copy(station.center)
    .addScaledVector(station.across, Math.sign(cos) * Math.abs(cos) ** (2 / power) * radius)
    .addScaledVector(station.through, Math.sign(sin) * Math.abs(sin) ** (2 / power) * radius);
}

/**
 * The end of a member, domed rather than flat. The pole is one point repeated around the ring,
 * which is degenerate on purpose: the triangles that reach it from the ring below are not, so
 * every vertex still gets a normal, and a flat disc cap would catch the key light as a bright
 * coin on the end of every leg.
 *
 * The near cap is walked backwards around its section. Both caps grow away from the member, so
 * they grow in *opposite* directions along the path — and a cap that keeps the wall's winding
 * at the near end comes out facing inward. Back-face culled, that is a crescent bitten out of
 * the end of every arm pad, lever and leg on the chair, and it is invisible in a wireframe.
 */
function domeSheet(sweep: Sweep, end: 0 | 1, segments: number): Sheet {
  const station = sweep.at(end);
  const inward = sweep.at(end === 0 ? 0.03 : 0.97);
  const power = sweep.power ?? SECTION_POWER;
  const reach = Math.min(station.across.length(), station.through.length());
  const out = new Vector3().subVectors(station.center, inward.center).setLength(reach);
  const turn = end === 0 ? -Math.PI * 2 : Math.PI * 2;

  return {
    rows: 4,
    columns: segments,
    point: (u, v) =>
      sectionAt(station, v * turn, Math.cos((u * Math.PI) / 2), power).addScaledVector(
        out,
        Math.sin((u * Math.PI) / 2),
      ),
  };
}

function sweepSheets(sweep: Sweep): readonly Sheet[] {
  const segments = sweep.segments ?? SECTION_SEGMENTS;
  const power = sweep.power ?? SECTION_POWER;
  const wall: Sheet = {
    rows: sweep.steps,
    columns: segments,
    point: (u, v) => sectionAt(sweep.at(u), v * Math.PI * 2, 1, power),
  };

  return sweep.capped
    ? [wall, domeSheet(sweep, 0, segments), domeSheet(sweep, 1, segments)]
    : [wall];
}

/**
 * A section frame built from where the member is going and which way the surface faces.
 *
 * `across` is `facing × along` and the order matters: it decides which way round the section is
 * walked, and so which way every triangle on the member faces. Taken the other way the whole
 * chair is wound inside out — which does not throw and does not look empty, because back-face
 * culling then shows you each member's *far* wall instead of its near one. `chair.test.ts`
 * measures the enclosed volume rather than trusting this.
 */
function station(
  center: Vector3,
  along: Vector3,
  facing: Vector3,
  halfWide: number,
  halfThick: number,
): Station {
  const through = facing.clone().normalize();
  const across = new Vector3().crossVectors(through, along).normalize();

  return {
    center,
    across: across.multiplyScalar(halfWide),
    through: through.multiplyScalar(halfThick),
  };
}

/**
 * A closed outline in a surface's own parameter space, walked as a very boxy superellipse:
 * the sides run straight for most of their length and the four corners round over the last
 * fraction of it. The back and the seat are both cut out this way, which is why neither has a
 * spliced joint at a corner — the one place a swept loop pinches.
 */
function loopAt(
  turn: number,
  boxiness: number,
): { readonly across: number; readonly along: number } {
  const angle = turn * Math.PI * 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    across: Math.sign(cos) * Math.abs(cos) ** (2 / boxiness),
    along: Math.sign(sin) * Math.abs(sin) ** (2 / boxiness),
  };
}

/* ── the back ─────────────────────────────────────────────────────────────────────────── */

/** The back's frame member: 3.2 cm across the face of the chair, 3.8 cm front to back. */
const RAIL_HALF_WIDE = 0.016;

/** How far a woven panel runs *under* the rail it is stretched on, rather than up against it. */
const PANEL_TUCK = 0.005;

export const BACK = {
  bottomY: 0.545,
  /** The rail's *centerline*, so the outside of the molding is what reaches `AERON.crownY`. */
  topY: AERON.crownY - RAIL_HALF_WIDE,
  railHalfWide: RAIL_HALF_WIDE,
  railHalfThick: 0.019,
  /** How far the woven panel stands in front of the rails it is stretched on. */
  standoff: 0.01,
  /** How far the middle of the back sits behind its edges — the wrap around the sitter. */
  bow: 0.021,
} as const;

/**
 * The lean, as the z of the rail centerline against height. Not a straight line and not a
 * single arc: the back comes *forward* a centimeter at a quarter height, which is the lumbar,
 * then falls away twice as fast above the shoulder blades and rolls back hard at the crown.
 * Straightened into one line, the whole chair reads as a folding chair with a tall back.
 */
const BACK_LEAN: readonly Knot[] = [
  [0, -0.196],
  [0.22, -0.186],
  [0.45, -0.214],
  [0.7, -0.244],
  [0.88, -0.268],
  [1, -0.293],
];

/**
 * The plan: half-width of the frame's outer edge, which is the silhouette. Widest at three
 * quarters — up at the shoulders rather than at the waist — and turning in hard above them.
 * That inverted taper is the shape people recognize from across a room.
 */
const BACK_PLAN: readonly Knot[] = [
  [0, 0.166],
  [0.1, 0.192],
  [0.22, 0.204],
  [0.35, 0.214],
  [0.48, 0.224],
  [0.62, 0.246],
  [0.72, 0.263],
  [0.8, 0.272],
  [0.87, 0.261],
  [0.92, 0.238],
  [0.96, 0.205],
  [1, 0.105],
];

export function backHalfAt(rise: number): number {
  return sampleCurve(BACK_PLAN, rise);
}

/**
 * The woven panel's boundary: the silhouette less the rail it is stretched on.
 *
 * A pass that gave the panel a measured plan of its own is worth not repeating. There *is* a
 * dead-straight edge at 14 cm running up both sides of the glTF's frame, and reading it as the
 * panel's boundary made the frame a swollen, lumpy ribbon. It is a rib behind the mesh, not the
 * inside of the rail — the model's own mesh panel reaches past it.
 */
export function backInnerAt(rise: number): number {
  // Buried a few millimeters inside the rail, not laid against its inner face: a panel edge
  // that lands exactly on another surface z-fights with it along the whole boundary.
  return Math.max(0.006, backHalfAt(rise) - RAIL_HALF_WIDE * 2 + PANEL_TUCK);
}

/**
 * The back as a surface: `rise` runs 0 at the bottom rail to 1 at the crown and `across` -1 to
 * 1, with `half` saying which of the frame's two edges is being walked. The rails and the
 * panel are cut from the same surface, which is what keeps the panel inside its frame at
 * every height without a second set of measurements for the lean.
 */
function backAt(rise: number, across: number, half: number): Vector3 {
  const wrap = BACK.bow * (1 - across * across);

  return new Vector3(
    across * half,
    BACK.bottomY + (BACK.topY - BACK.bottomY) * rise,
    sampleCurve(BACK_LEAN, rise) + BACK.standoff - wrap,
  );
}

function backPanelAt(rise: number, across: number): Vector3 {
  return backAt(rise, across, backInnerAt(rise));
}

/** Which way the woven panel faces: the surface's own normal, taken from its two tangents. */
function backFacingAt(rise: number, across: number): Vector3 {
  const up = new Vector3().subVectors(
    backPanelAt(rise + 0.01, across),
    backPanelAt(rise - 0.01, across),
  );
  const side = new Vector3().subVectors(
    backPanelAt(rise, across + 0.03),
    backPanelAt(rise, across - 0.03),
  );

  return new Vector3().crossVectors(side, up).normalize();
}

const BACK_BOXINESS = 5.5;

/** The rail's centerline: in from the silhouette by its own half-width. */
function backLoopAt(turn: number): Vector3 {
  const { across, along } = loopAt(turn, BACK_BOXINESS);
  const rise = (along + 1) / 2;

  return backAt(rise, across, Math.max(0.006, backHalfAt(rise) - RAIL_HALF_WIDE));
}

/** The frame the panel is stretched in: one closed member around the whole outline. */
function backFrameSweep(): Sweep {
  return {
    steps: 150,
    power: 4.4,
    at: (s) => {
      const { across, along } = loopAt(s, BACK_BOXINESS);
      const rise = (along + 1) / 2;

      return station(
        backLoopAt(s),
        new Vector3().subVectors(backLoopAt(s + 0.004), backLoopAt(s - 0.004)),
        backFacingAt(rise, across),
        BACK.railHalfWide,
        BACK.railHalfThick,
      );
    },
  };
}

/** The woven panel, dished back between the rails so it reads as fabric under tension. */
const BACK_SAG = 0.014;

export function backPanelSheets(): readonly Sheet[] {
  return [
    {
      rows: 36,
      columns: 26,
      clusterColumns: true,
      point: (u, v) => {
        const rise = 0.015 + u * 0.96;
        const across = v * 2 - 1;
        const point = backPanelAt(rise, across);
        const taut = Math.sin(Math.min(rise / 0.12, 1) * (Math.PI / 2));
        point.z -= BACK_SAG * (1 - across * across) * taut;
        return point;
      },
    },
  ];
}

/**
 * The strut across the back of the panel — the one thing on this chair you see *through*
 * something else, and the reason the back does not read as a flat panel with a hole in it.
 *
 * It is a Y with a long tail rather than a wishbone: a deep spine up the middle from below the
 * bottom rail to just under the shoulder blades, forking there into two arms that reach the
 * frame's inner edge and then turn to run up alongside it. The spine is the deepest thing on
 * the chair front to back — nine centimeters of it stand out behind the mesh — which is what
 * throws the shadow you actually see from the front.
 */
const STRUT = {
  footY: 0.468,
  forkY: 0.658,
  armY: 0.724,
  topY: 0.758,
  spineHalfWide: 0.036,
  /** The spine does not taper to a point above the fork — it opens into a rounded lobe. */
  spineTopHalfWide: 0.062,
  spineHalfDeep: 0.045,
  armHalfWide: 0.026,
  armHalfDeep: 0.023,
} as const;

/** Behind the panel by its own depth, so the mesh is never pierced by what is bracing it. */
function strutBehind(y: number, half: number): number {
  const rise = (y - BACK.bottomY) / (BACK.topY - BACK.bottomY);
  return sampleCurve(BACK_LEAN, Math.min(Math.max(rise, 0), 1)) - half - 0.006;
}

function strutSweeps(): readonly Sweep[] {
  const spine = (s: number): Vector3 => {
    const y = STRUT.footY + (STRUT.topY - STRUT.footY) * s;
    return new Vector3(0, y, strutBehind(y, STRUT.spineHalfDeep));
  };
  const arm = (side: number, s: number): Vector3 => {
    const reach = Math.min(s / 0.72, 1);
    const y = STRUT.forkY + (STRUT.topY - STRUT.forkY) * s;
    return new Vector3(
      side * (0.024 + 0.126 * (reach * reach * (3 - 2 * reach))),
      y,
      strutBehind(y, STRUT.armHalfDeep),
    );
  };

  return [
    {
      steps: 22,
      capped: true,
      power: 3.6,
      at: (s) =>
        station(
          spine(s),
          new Vector3(0, 1, 0),
          new Vector3(0, 0, 1),
          STRUT.spineHalfWide + (STRUT.spineTopHalfWide - STRUT.spineHalfWide) * s ** 2.4,
          STRUT.spineHalfDeep - 0.023 * s ** 1.8,
        ),
    },
    ...[-1, 1].map((side) => ({
      steps: 20,
      capped: true,
      power: 3.4,
      at: (s: number) =>
        station(
          arm(side, s),
          new Vector3().subVectors(arm(side, s + 0.03), arm(side, s - 0.03)),
          new Vector3(0, 0, 1),
          STRUT.armHalfWide,
          STRUT.armHalfDeep,
        ),
    })),
  ];
}

/* ── the seat ─────────────────────────────────────────────────────────────────────────── */

export const SEAT = {
  backZ: -0.195,
  frontZ: 0.288,
  /** The rail is a broad sculpted member rather than a tube: 3.8 cm across, 4.2 cm deep. */
  railHalfWide: 0.019,
  railHalfThick: 0.021,
  /** How far below the rail's top edge the panel is clamped to its inner face. */
  edgeDrop: 0.016,
} as const;

/** The plan: half-width of the rail's outer edge, from the back of the pan to the nose. */
const SEAT_PLAN: readonly Knot[] = [
  [0, 0.12],
  [0.072, 0.19],
  [0.155, 0.251],
  [0.238, 0.258],
  [0.404, 0.262],
  [0.57, 0.257],
  [0.736, 0.25],
  [0.819, 0.243],
  [0.902, 0.229],
  [0.985, 0.174],
  [1, 0.105],
];

/**
 * The rail's top edge, and the one measurement that makes this seat *this* seat: it is not a
 * flat rim around a dish. It arcs — 50 cm at the back of the pan, cresting at 56 just ahead of
 * the middle, then sweeping down and forward to 49 at the nose — and for most of that run it
 * stands four centimeters clear of the woven panel. What that leaves is a raised gunwale down
 * each side of the seat and a waterfall at the front, which is the shape you see from every
 * angle. Flatten this curve and the seat goes back to reading as a disc on a post.
 */
const SEAT_RAIL: readonly Knot[] = [
  [0, 0.5],
  [0.072, 0.512],
  [0.155, 0.53],
  [0.238, 0.548],
  [0.321, 0.556],
  [0.487, 0.56],
  [0.653, 0.549],
  [0.736, 0.542],
  [0.819, 0.529],
  [0.902, 0.516],
  [0.985, 0.498],
  [1, 0.492],
];

/**
 * The line the panel hangs on down the *middle* of the seat. It crowns under the thighs two
 * thirds of the way forward and falls away 6 cm to the back of the pan, which is the cradle you
 * actually sit in; the last few centimeters roll down again over the nose.
 *
 * Its edges are not on this line. They are clamped to the inner face of the rail, wherever that
 * rail happens to be — so the dish across the seat is the *difference* between the two measured
 * curves rather than a number, and it deepens and shallows down the pan the way it really does.
 * Given a plan of its own the panel pulled away from the frame at the back and left daylight
 * between the two, which is the tell that a seat is two parts instead of one.
 */
const SEAT_PANEL_LINE: readonly Knot[] = [
  [0, 0.462],
  [0.093, 0.474],
  [0.145, 0.485],
  [0.197, 0.494],
  [0.3, 0.503],
  [0.404, 0.51],
  [0.507, 0.519],
  [0.611, 0.524],
  [0.69, 0.525],
  [0.766, 0.524],
  [0.818, 0.521],
  [0.87, 0.514],
  [0.921, 0.505],
  [0.973, 0.492],
  [1, 0.482],
];

function seatZAt(depth: number): number {
  return SEAT.backZ + (SEAT.frontZ - SEAT.backZ) * depth;
}

export function seatHalfAt(depth: number): number {
  return sampleCurve(SEAT_PLAN, depth);
}

export function seatRailAt(depth: number): number {
  return sampleCurve(SEAT_RAIL, depth);
}

/** The rail's centerline: in from its outer edge, and down from its top, by its own section. */
function seatRailPointAt(depth: number, across: number): Vector3 {
  const half = Math.max(0.004, seatHalfAt(depth) - SEAT.railHalfWide);

  return new Vector3(across * half, seatRailAt(depth) - SEAT.railHalfThick, seatZAt(depth));
}

const SEAT_BOXINESS = 6;

function seatLoopAt(turn: number): Vector3 {
  const { across, along } = loopAt(turn, SEAT_BOXINESS);
  return seatRailPointAt((along + 1) / 2, across);
}

/** The rim: one closed member around the pan, cut from the boundary of the pan's own plan. */
function seatFrameSweep(): Sweep {
  return {
    steps: 130,
    power: 3.6,
    at: (s) =>
      station(
        seatLoopAt(s),
        new Vector3().subVectors(seatLoopAt(s + 0.004), seatLoopAt(s - 0.004)),
        new Vector3(0, 1, 0),
        SEAT.railHalfWide,
        SEAT.railHalfThick,
      ),
  };
}

/**
 * A point on the woven panel: `across` 0 on the centerline, ±1 at the rail. The blend runs
 * flat through the middle and turns up hard near the edge, which is how a panel clamped at
 * both sides and loaded in the middle actually hangs.
 */
function seatPanelAt(depth: number, across: number): Vector3 {
  const edge = seatRailAt(depth) - SEAT.edgeDrop;
  const middle = sampleCurve(SEAT_PANEL_LINE, depth);

  return new Vector3(
    across * Math.max(0.012, seatHalfAt(depth) - SEAT.railHalfWide * 2 + PANEL_TUCK),
    middle + (edge - middle) * Math.abs(across) ** 1.7,
    seatZAt(depth),
  );
}

export function seatPanelSheets(): readonly Sheet[] {
  return [
    {
      rows: 32,
      columns: 34,
      clusterRows: true,
      clusterColumns: true,
      point: (u, v) => seatPanelAt(0.012 + u * 0.976, v * 2 - 1),
    },
  ];
}

/* ── the arms ─────────────────────────────────────────────────────────────────────────── */

export const ARM = {
  padY: 0.724,
  padBackZ: -0.165,
  padFrontZ: 0.13,
  /** 9.6 cm across and 4.2 thick, off the real pad — broad and flat, not a roll. */
  padHalfWide: 0.048,
  padHalfThick: 0.021,
} as const;

/**
 * The arm is one member, not a bracket with a post on top, and the way its section changes
 * along that member is the whole character of it. Where it bolts on beside the sitter's hip it
 * is a broad plate — 8 cm across the chair, shallow front to back. By two thirds of the way up
 * it has turned inside out: barely a centimeter thick but 6 cm deep, which from the side is the
 * slim blade the height lever slots into. Then it flares again into the plate the pad sits on.
 * Built as two parts with a joint between them, it read as a lump behind the seat.
 *
 * It bolts to the **back frame's** lower rail rather than to the seat, which is why the foot
 * reaches inboard far enough to touch it. That is not a detail: it is why an Aeron's arms lean
 * back when its back does, and it puts the whole arm behind the sitter's hip rather than beside
 * it — the thing that shows in the silhouette.
 */
const ARM_STEM = {
  x: [
    [0, 0.221],
    [0.28, 0.237],
    [0.41, 0.24],
    [0.53, 0.276],
    [0.78, 0.282],
    [1, 0.282],
  ],
  y: [
    [0, 0.548],
    [0.28, 0.6],
    [0.41, 0.62],
    [0.53, 0.639],
    [0.78, 0.672],
    [1, 0.694],
  ],
  z: [
    [0, -0.193],
    [0.28, -0.162],
    [0.41, -0.151],
    [0.53, -0.121],
    [0.78, -0.085],
    [1, -0.072],
  ],
  /** Front to back — the depth that makes it a blade in profile. */
  deep: [
    [0, 0.022],
    [0.28, 0.046],
    [0.41, 0.053],
    [0.53, 0.032],
    [0.66, 0.023],
    [0.78, 0.039],
    [1, 0.054],
  ],
  /** Across the chair — the thickness that makes it a plate at the bottom. */
  thick: [
    [0, 0.043],
    [0.28, 0.043],
    [0.41, 0.044],
    [0.53, 0.01],
    [0.66, 0.008],
    [0.78, 0.015],
    [1, 0.023],
  ],
} satisfies Record<string, readonly Knot[]>;

/**
 * The stem stops well *inside* the pad rather than against its underside, and the margin is
 * larger than it looks like it needs to be for two reasons that compound. A member's end is
 * domed, so it grows past its last station; and this member leans forward, so its section — a
 * blade ten centimeters deep — tilts with it and rides its rear corner up four centimeters
 * above the station's own center. Ended flush against the pad it pushed a rounded bump up
 * through the top of it, right where a sitter's forearm goes. `chair.test.ts` measures the
 * clearance rather than trusting these numbers.
 */

/**
 * The stem stops well *inside* the pad rather than against its underside, and it needs more
 * margin than it looks like it does. A member's end is domed, so it grows past its last station
 * by the smaller of that station's two half-extents; and this one leans forward, so its section
 * tilts with it and rides a corner up as well. Ended flush against the pad, the two together
 * pushed a rounded bump out through the top of it, right where a forearm goes. `chair.test.ts`
 * measures the clearance rather than trusting these numbers.
 */
function armStemAt(side: number, s: number): Vector3 {
  return new Vector3(
    side * sampleCurve(ARM_STEM.x, s),
    sampleCurve(ARM_STEM.y, s),
    sampleCurve(ARM_STEM.z, s),
  );
}

function armSweeps(side: number): readonly Sweep[] {
  return [
    {
      steps: 40,
      capped: true,
      power: 3.6,
      at: (s) =>
        station(
          armStemAt(side, s),
          new Vector3().subVectors(armStemAt(side, s + 0.02), armStemAt(side, s - 0.02)),
          new Vector3(side, 0, 0),
          sampleCurve(ARM_STEM.deep, s),
          sampleCurve(ARM_STEM.thick, s),
        ),
    },
  ];
}

/**
 * The pad, and it is not symmetric: it tapers away to nothing at the back where it meets the
 * stem, and stays full width right to a rounded nose at the front. It also walks outward and
 * lifts as it goes — 28 cm from the middle at the back, 29.7 at the front, and a centimeter
 * higher — so the pair splay very slightly, the way a pair of forearms do.
 *
 * Its section runs squarer than anything else on the chair. This is a soft pad with a nearly
 * flat top and a break at each edge, and rounded off like a frame member it reads as a length
 * of pipe laid across the arm.
 */
const PAD_TAPER: readonly Knot[] = [
  [0, 0.56],
  [0.08, 0.68],
  [0.2, 0.85],
  [0.35, 0.95],
  [0.55, 0.985],
  [1, 1],
];

const PAD_OUT: readonly Knot[] = [
  [0, 0.28],
  [0.15, 0.2835],
  [0.29, 0.2865],
  [0.42, 0.292],
  [0.7, 0.298],
  [1, 0.296],
];

function armPadSweep(side: number): Sweep {
  const taper = (s: number): number => sampleCurve(PAD_TAPER, s);

  return {
    steps: 30,
    segments: 18,
    capped: true,
    power: 4.6,
    at: (s) =>
      station(
        new Vector3(
          side * sampleCurve(PAD_OUT, s),
          ARM.padY + 0.009 * s,
          ARM.padBackZ + (ARM.padFrontZ - ARM.padBackZ) * s,
        ),
        new Vector3(0, 0, 1),
        new Vector3(0, 1, 0),
        ARM.padHalfWide * taper(s),
        ARM.padHalfThick * taper(s),
      ),
  };
}

/* ── the mechanism, the column and the base ───────────────────────────────────────────── */

export const BASE = {
  hubY: 0.209,
  columnTopY: 0.33,
  legs: 5,
  casterRadius: 0.031,
  tireHalfWide: 0.011,
  /** How far the wheels trail behind the pivot they hang from — why a caster swivels. */
  trail: 0.026,
} as const;

/**
 * Under the seat: the tilt housing, the two side plates the back of the pan is carried on, the
 * links between them, and the paddles that stick out of the sides.
 *
 * This assembly is most of what fills the space between the pan and the base, and leaving it as
 * one small block is what made the seat look like it was floating on the column. It stops short
 * of the arms on purpose: those bolt to the back frame, not to this.
 */
function chassisSweeps(): readonly Sweep[] {
  const plate = (side: number, s: number): Vector3 =>
    new Vector3(side * (0.266 + 0.01 * Math.sin(s * Math.PI)), 0.468 + 0.014 * s, -0.2 + 0.21 * s);
  const link = (side: number, s: number): Vector3 =>
    new Vector3(side * (0.1 + 0.16 * s), 0.398 + 0.078 * s, -0.09 - 0.07 * s);

  return [
    // The tilt housing: a wedge, deepest under the middle of the pan and tapering forward.
    {
      steps: 20,
      capped: true,
      power: 4,
      segments: 14,
      at: (s) =>
        station(
          new Vector3(0, 0.374 - 0.016 * Math.sin(s * Math.PI), -0.13 + 0.32 * s),
          new Vector3(0, 0, 1),
          new Vector3(0, 1, 0),
          0.098 + 0.058 * Math.sin(s * Math.PI) - 0.05 * s * s,
          0.038 + 0.018 * Math.sin(s * Math.PI) - 0.016 * s,
        ),
    },
    ...[-1, 1].flatMap((side) => [
      {
        steps: 16,
        capped: true,
        power: 4.2,
        segments: 12,
        at: (s: number) =>
          station(
            plate(side, s),
            new Vector3().subVectors(plate(side, s + 0.03), plate(side, s - 0.03)),
            new Vector3(side, 0, 0),
            0.034 - 0.008 * s * s,
            0.013,
          ),
      },
      {
        steps: 10,
        capped: true,
        power: 3.4,
        segments: 10,
        at: (s: number) =>
          station(
            link(side, s),
            new Vector3().subVectors(link(side, s + 0.05), link(side, s - 0.05)),
            new Vector3(0, 1, 0),
            0.024 - 0.008 * s,
            0.014,
          ),
      },
      // The paddle: tilt tension on one side, the tilt limiter on the other.
      {
        steps: 8,
        capped: true,
        power: 3,
        segments: 10,
        at: (s: number) =>
          station(
            new Vector3(side * (0.09 + 0.155 * s), 0.348, 0.128),
            new Vector3(side, 0, 0),
            new Vector3(0, 1, 0),
            0.009 + 0.006 * s ** 4,
            0.009 + 0.006 * s ** 4,
          ),
      },
    ]),
  ];
}

/**
 * The gas cylinder, and the hub the legs leave from — one turned profile, because on the real
 * chair they are one molding with the shroud pulled down over the top of the star.
 *
 * The profile begins and ends *on the axis*, so the surface closes over at both poles. Run
 * from a finite radius instead it is an open tube, and from anywhere low in the room you see
 * straight up the inside of the column.
 */
const COLUMN_RADIUS: readonly Knot[] = [
  [0, 0],
  [0.05, 0.046],
  [0.12, 0.052],
  [0.3, 0.05],
  [0.42, 0.04],
  [0.55, 0.028],
  [0.75, 0.0255],
  [0.96, 0.0255],
  [1, 0],
];

const COLUMN_HEIGHT: readonly Knot[] = [
  [0, 0.022],
  [0.05, 0.028],
  [0.12, 0.045],
  [0.3, 0.09],
  [0.42, 0.135],
  [0.55, 0.19],
  [0.75, 0.26],
  [0.96, 0.325],
  [1, 0.332],
];

export function columnSheets(): readonly Sheet[] {
  return [
    {
      rows: 26,
      columns: 18,
      clusterRows: true,
      point: (u, v) => {
        const angle = v * Math.PI * 2;
        const radius = sampleCurve(COLUMN_RADIUS, u);
        return new Vector3(
          radius * Math.sin(angle),
          sampleCurve(COLUMN_HEIGHT, u),
          radius * Math.cos(angle),
        );
      },
    },
  ];
}

/**
 * One leg: deepest where it leaves the hub and thinned to the tip, arched just enough that the
 * light finds a top surface on it. The stem below the tip is the caster's own pivot, so the
 * leg and what it stands on are one member.
 */
function legSweep(turn: number): Sweep {
  const out = new Vector3(Math.sin(turn), 0, Math.cos(turn));

  return {
    steps: 22,
    capped: true,
    segments: 12,
    at: (s) => {
      const reach = 0.045 + (AERON.baseRadius - 0.045) * s;
      const arch = 0.096 + 0.014 * Math.sin(s * Math.PI) - 0.012 * s;

      return station(
        out.clone().multiplyScalar(reach).setY(arch),
        out,
        new Vector3(0, 1, 0),
        0.038 - 0.02 * s,
        0.032 - 0.017 * s,
      );
    },
  };
}

function casterStemSweep(turn: number): Sweep {
  const out = new Vector3(Math.sin(turn), 0, Math.cos(turn));
  const top = out.clone().multiplyScalar(AERON.baseRadius).setY(0.09);

  return {
    steps: 6,
    capped: true,
    segments: 10,
    at: (s) =>
      station(
        top
          .clone()
          .setY(0.09 - 0.05 * s)
          .addScaledVector(out, -BASE.trail * s * 0.35),
        // Down, because that is the way this member is actually going. Handed the opposite
        // vector the section is walked backwards and the stem renders inside out.
        new Vector3(0, -1, 0),
        out,
        0.017 - 0.004 * s,
        0.017 - 0.004 * s,
      ),
  };
}

/**
 * The ten wheels, baked where they stand: nothing here turns, so this is one draw call.
 *
 * Each is a *ring* — a closed section carried around the axle, with a bore at the middle that
 * the caster's own stem fills. Drawn as a band between two rims instead it is open at both
 * sides, and from any low angle a caster is a hoop you can see through.
 */
const WHEEL_BORE = 0.011;
const WHEEL_BOXINESS = 3.4;

export function wheelSheets(): readonly Sheet[] {
  const sheets: Sheet[] = [];
  const midRadius = (BASE.casterRadius + WHEEL_BORE) / 2;
  const halfRadius = (BASE.casterRadius - WHEEL_BORE) / 2;

  for (let leg = 0; leg < BASE.legs; leg += 1) {
    const turn = (leg * Math.PI * 2) / BASE.legs;
    const out = new Vector3(Math.sin(turn), 0, Math.cos(turn));
    const side = new Vector3(out.z, 0, -out.x);
    const axle = out
      .clone()
      .multiplyScalar(AERON.baseRadius - BASE.trail)
      .setY(BASE.casterRadius);

    for (const offset of [-0.0195, 0.0195]) {
      const center = axle.clone().addScaledVector(side, offset);
      sheets.push({
        rows: 12,
        columns: 16,
        point: (u, v) => {
          const profile = loopAt(u, WHEEL_BOXINESS);
          const radius = midRadius + profile.along * halfRadius;
          const spin = -v * Math.PI * 2;
          return center
            .clone()
            .addScaledVector(side, profile.across * BASE.tireHalfWide)
            .addScaledVector(out, radius * Math.sin(spin))
            .setY(BASE.casterRadius + radius * Math.cos(spin));
        },
      });
    }
  }

  return sheets;
}

/* ── materials, and the chair as one object ───────────────────────────────────────────── */

/**
 * Graphite, and plastic rather than metal: every structural part of this chair is a glass-filled
 * nylon molding, so what the light should find on a rail is a broad soft highlight and not the
 * hard specular line the room's metal presets give.
 */
const AERON_FRAME = { color: "#15191d", roughness: 0.54, metalness: 0.22 } as const;

/**
 * The woven panels. Translucency is the whole read of this chair at room distance and it is a
 * material property here rather than a texture — see the file header. Kept above half opacity
 * so the panel still holds an edge against the dark wall behind it.
 */
const AERON_PELLICLE = {
  color: "#1c222a",
  roughness: 0.92,
  metalness: 0.03,
  opacity: 0.68,
} as const;

/**
 * The armpads. A little lighter and a lot smoother than the frame, because they are the one
 * upholstered part on the chair and the only place the room's key light gets a soft highlight
 * to sit on — without that they read as two more moldings.
 */
const AERON_PAD = { color: "#171d23", roughness: 0.52, metalness: 0.14 } as const;

const CASTER_TIRE = { color: "#06090b", roughness: 0.95, metalness: 0.02 } as const;

const SIDES = [-1, 1] as const;

export function legTurns(): readonly number[] {
  return Array.from({ length: BASE.legs }, (_, leg) => (leg * Math.PI * 2) / BASE.legs);
}

/** Every molded member on the chair, in one geometry: nothing here moves, so it is one draw. */
export function frameSheets(): readonly Sheet[] {
  return [
    ...sweepSheets(backFrameSweep()),
    ...strutSweeps().flatMap(sweepSheets),
    ...sweepSheets(seatFrameSweep()),
    ...SIDES.flatMap((side) => armSweeps(side).flatMap(sweepSheets)),
    ...chassisSweeps().flatMap(sweepSheets),
    ...columnSheets(),
    ...legTurns().flatMap((turn) => [
      ...sweepSheets(legSweep(turn)),
      ...sweepSheets(casterStemSweep(turn)),
    ]),
  ];
}

export function padSheets(): readonly Sheet[] {
  return SIDES.flatMap((side) => sweepSheets(armPadSweep(side)));
}

function ChairFrame(): ReactElement {
  const parts = useDisposable(() => ({
    frame: createShell(frameSheets()),
    pads: createShell(padSheets()),
    wheels: createShell(wheelSheets()),
  }));

  return (
    <>
      <mesh geometry={parts.frame}>
        <meshStandardMaterial {...AERON_FRAME} />
      </mesh>
      <mesh geometry={parts.pads}>
        <meshStandardMaterial {...AERON_PAD} />
      </mesh>
      <mesh geometry={parts.wheels}>
        <meshStandardMaterial {...CASTER_TIRE} />
      </mesh>
    </>
  );
}

function ChairPanels(): ReactElement {
  const panels = useDisposable(() => ({
    back: createShell(backPanelSheets()),
    seat: createShell(seatPanelSheets()),
  }));

  return (
    <>
      <mesh geometry={panels.back}>
        <meshStandardMaterial {...AERON_PELLICLE} transparent side={DoubleSide} />
      </mesh>
      <mesh geometry={panels.seat}>
        <meshStandardMaterial {...AERON_PELLICLE} transparent side={DoubleSide} />
      </mesh>
    </>
  );
}

/**
 * In front of the desk and turned a few degrees off square, the way a chair someone has just
 * got up from is. The model faces the room — that is the frame every measurement above is in —
 * so the half turn here is what puts it at the desk, and pushing it any closer than this is
 * what would put the armpads through the desk top.
 */
export const CHAIR_PLACEMENT = { x: 0.06, z: 0.95, turn: Math.PI - 0.13 } as const;

export function Chair(): ReactElement {
  return (
    <group
      position={[CHAIR_PLACEMENT.x, 0, CHAIR_PLACEMENT.z]}
      rotation={[0, CHAIR_PLACEMENT.turn, 0]}
    >
      <ChairFrame />
      <ChairPanels />
    </group>
  );
}

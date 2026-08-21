import { Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { DESK_DEPTH, DESK_LEG_HEIGHT, DESK_TOP_Y } from "../room";
import { createShell, type Sheet } from "./shell";
import {
  AERON,
  ARM,
  BACK,
  BASE,
  CHAIR_PLACEMENT,
  SEAT,
  backHalfAt,
  backInnerAt,
  backPanelSheets,
  columnSheets,
  frameSheets,
  legTurns,
  padSheets,
  seatPanelSheets,
  seatHalfAt,
  seatRailAt,
  wheelSheets,
} from "./chair";

/**
 * The chair is a frame you can see through, so almost everything that can go wrong with it is
 * quiet. A woven panel drifts outside the frame it is stretched in and reads as a torn one; a
 * swept member's end cap loses its normal and leaves a black coin; a base sinks a millimeter
 * and the chair floats. None of those throws.
 *
 * The last group is the one that has actually bitten a room like this: the chair is the only
 * object placed against another piece of furniture, and a chair intersecting the desk is
 * invisible in code review and unmissable on screen.
 */

function points(sheets: readonly Sheet[]): readonly Vector3[] {
  const position = createShell(sheets).getAttribute("position");

  return Array.from({ length: position.count }, (_, index) =>
    new Vector3().fromBufferAttribute(position, index),
  );
}

/** One row of the seat panel: the sampled station nearest a given depth down the pan. */
function seatBand(depth: number): readonly Vector3[] {
  const target = SEAT.backZ + (SEAT.frontZ - SEAT.backZ) * depth;
  const all = points(seatPanelSheets());
  const nearest = all.reduce((best, point) =>
    Math.abs(point.z - target) < Math.abs(best.z - target) ? point : best,
  );

  return all.filter((point) => Math.abs(point.z - nearest.z) < 1e-6);
}

/** The middle of that row, which is where a person's weight goes. */
function seatMiddleAt(depth: number): number {
  return seatBand(depth).reduce((best, point) =>
    Math.abs(point.x) < Math.abs(best.x) ? point : best,
  ).y;
}

const PARTS = {
  frame: frameSheets(),
  pads: padSheets(),
  wheels: wheelSheets(),
  back: backPanelSheets(),
  seat: seatPanelSheets(),
};

/** Everything that is a closed shell. The two panels are open sheets, drawn double-sided. */
const SOLIDS = {
  frame: PARTS.frame,
  pads: PARTS.pads,
  wheels: PARTS.wheels,
  column: columnSheets(),
};

/**
 * The volume a closed shell encloses, from its own winding. Positive when every triangle faces
 * outward; a patch that faces inward subtracts instead of adding, so one inverted end cap in a
 * hundred sheets shows up here as a number that has moved.
 */
/** Every triangle with area, as its centroid and the way its own winding makes it face. */
function trianglesOf(sheets: readonly Sheet[]): readonly { center: Vector3; facing: Vector3 }[] {
  const geometry = createShell(sheets);
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex()!;
  const faces: { center: Vector3; facing: Vector3 }[] = [];

  for (let at = 0; at < index.count; at += 3) {
    const corners = [0, 1, 2].map((step) =>
      new Vector3().fromBufferAttribute(position, index.getX(at + step)),
    ) as [Vector3, Vector3, Vector3];
    const facing = new Vector3()
      .subVectors(corners[1], corners[0])
      .cross(new Vector3().subVectors(corners[2], corners[0]));
    // A grid closing on a pole leaves rings of coincident vertices behind; their triangles
    // have no area, no direction, and nothing to say about which way the surface faces.
    if (facing.lengthSq() < 1e-18) continue;
    faces.push({
      center: corners[0].clone().add(corners[1]).add(corners[2]).divideScalar(3),
      facing: facing.normalize(),
    });
  }

  return faces;
}

function signedVolume(sheets: readonly Sheet[]): number {
  const geometry = createShell(sheets);
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex()!;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  let total = 0;

  for (let at = 0; at < index.count; at += 3) {
    a.fromBufferAttribute(position, index.getX(at));
    b.fromBufferAttribute(position, index.getX(at + 1));
    c.fromBufferAttribute(position, index.getX(at + 2));
    total += a.dot(b.clone().cross(c)) / 6;
  }

  return total;
}

describe("the built geometry", () => {
  /**
   * Every solid on this chair is a closed shell, and a shell wound inside out does not throw —
   * it renders as a hole. That is exactly how both end caps of every swept member, the ten
   * caster wheels and the gas column all shipped with pieces missing: back-face culled, an
   * inverted patch is a crescent bitten out of an arm pad or a wheel you can see through.
   */
  it("winds every solid outward, so nothing renders as a hole", () => {
    for (const [name, sheets] of Object.entries(SOLIDS)) {
      expect.soft(signedVolume(sheets), name).toBeGreaterThan(0);
    }
  });

  /**
   * The volume alone can hide a small patch inside a large part, so this checks the one thing
   * that is true of *every* closed shell however lumpy: the vertex furthest along any direction
   * has to face that way. It is what caught the caster stems, whose sweep was handed an upward
   * vector while its path ran down.
   */
  it("faces outward at the far end of every axis", () => {
    const axes = [
      new Vector3(1, 0, 0),
      new Vector3(-1, 0, 0),
      new Vector3(0, 1, 0),
      new Vector3(0, -1, 0),
      new Vector3(0, 0, 1),
      new Vector3(0, 0, -1),
    ];

    for (const [name, sheets] of Object.entries(SOLIDS)) {
      const faces = trianglesOf(sheets);

      for (const axis of axes) {
        const furthest = faces.reduce((best, face) =>
          face.center.dot(axis) > best.center.dot(axis) ? face : best,
        );
        expect.soft(furthest.facing.dot(axis), `${name} ${axis.toArray()}`).toBeGreaterThan(0);
      }
    }
  });

  it("has a finite normal everywhere, including every domed end", () => {
    for (const [name, sheets] of Object.entries(PARTS)) {
      const normals = Array.from(createShell(sheets).getAttribute("normal").array);

      expect.soft(normals.length, name).toBeGreaterThan(0);
      expect.soft(normals.every(Number.isFinite), name).toBe(true);
    }
  });

  it("stands on the floor rather than through it", () => {
    for (const [name, sheets] of Object.entries(PARTS)) {
      for (const point of points(sheets)) expect.soft(point.y, name).toBeGreaterThanOrEqual(-1e-9);
    }
  });

  it("stands on its wheels, and on nothing else", () => {
    const lowestWheel = Math.min(...points(PARTS.wheels).map((point) => point.y));
    const lowestFrame = Math.min(...points(PARTS.frame).map((point) => point.y));

    expect(lowestWheel).toBeCloseTo(0, 3);
    // A caster stem that reaches past its own wheel is a chair standing on five spikes.
    expect(lowestFrame).toBeGreaterThan(lowestWheel + 0.01);
  });

  it("carries the armpads a chair's width apart, above the seat and over it", () => {
    const pads = points(PARTS.pads);
    const span = Math.max(...pads.map((point) => Math.abs(point.x))) * 2;
    const front = Math.max(...pads.map((point) => point.z));

    expect(span).toBeCloseTo(AERON.armSpan, 2);
    expect(Math.min(...pads.map((point) => point.y))).toBeGreaterThan(AERON.seatY + 0.15);
    // A pad has to reach out over the seat to be worth leaning on, and stop short of the nose
    // of it: an armpad overhanging the front of the seat is the thing that looks wrong.
    expect(front).toBeGreaterThan(0);
    expect(front).toBeLessThan(SEAT.frontZ);
    expect(front - Math.min(...pads.map((point) => point.z))).toBeGreaterThan(ARM.padHalfWide * 4);
  });

  it("is as tall as it is measured to be, and no taller", () => {
    const crown = Math.max(...points(PARTS.frame).map((point) => point.y));

    expect(crown).toBeCloseTo(AERON.crownY, 2);
  });
});

describe("the panels, and the frames they are stretched in", () => {
  it("keeps the back panel inside the back frame at every height", () => {
    for (const point of points(PARTS.back)) {
      const rise = (point.y - BACK.bottomY) / (BACK.topY - BACK.bottomY);

      // Inside the frame's inner edge, which is the panel's own boundary — and comfortably
      // inside the silhouette, or the frame has no width left to read as a molding.
      expect.soft(Math.abs(point.x)).toBeLessThanOrEqual(backInnerAt(rise) + 1e-5);
      // Between the rail's centerline and its inner face — the panel's edge runs *under* the
      // rail. Landed exactly on that face it z-fights with it along the whole boundary.
      const under = backHalfAt(rise) - backInnerAt(rise);
      expect.soft(under).toBeGreaterThan(BACK.railHalfWide);
      expect.soft(under).toBeLessThan(BACK.railHalfWide * 2);
    }
  });

  it("keeps the seat panel inside its rail, and below the top of it", () => {
    for (const point of points(PARTS.seat)) {
      const depth = (point.z - SEAT.backZ) / (SEAT.frontZ - SEAT.backZ);

      expect.soft(Math.abs(point.x)).toBeLessThan(seatHalfAt(depth) - SEAT.railHalfWide);
      expect.soft(point.y).toBeLessThan(seatRailAt(depth));
    }
  });

  /**
   * The seat is a cradle front to back, not a bowl: it crowns under the thighs and falls away
   * to the back of the pan. A seat that reads as flat is the thing that looked wrong here.
   */
  it("crowns the seat panel under the thighs and drops it to the back of the pan", () => {
    const crown = seatMiddleAt(0.68);

    expect(crown).toBeCloseTo(AERON.seatY, 2);
    expect(crown - seatMiddleAt(0.05)).toBeGreaterThan(0.05);
    expect(crown - seatMiddleAt(0.98)).toBeGreaterThan(0.015);
  });

  /** The dish is the gap between the two measured curves, so it has to actually open up. */
  it("dishes the panel across the seat as well as along it", () => {
    const band = seatBand(0.42);
    const heights = band.map((point) => point.y);

    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.02);
    // And its edge has to run under the rail — short of it the seat shows daylight down both
    // sides, flush against it the two surfaces z-fight.
    const depth = (band[0]!.z - SEAT.backZ) / (SEAT.frontZ - SEAT.backZ);
    const reach = Math.max(...band.map((point) => Math.abs(point.x)));
    expect(reach).toBeGreaterThan(seatHalfAt(depth) - SEAT.railHalfWide * 2);
    expect(reach).toBeLessThan(seatHalfAt(depth) - SEAT.railHalfWide);
  });

  /**
   * The inverted taper is the whole silhouette: the back is widest at the shoulders and turns
   * in above them. Widest at the waist instead and it reads as any chair in any office.
   */
  it("carries the back's widest point above its middle", () => {
    const rises = Array.from({ length: 101 }, (_, step) => step / 100);
    const widest = rises.reduce((best, rise) =>
      backHalfAt(rise) > backHalfAt(best) ? rise : best,
    );

    expect(widest).toBeGreaterThan(0.6);
    expect(backHalfAt(1)).toBeLessThan(backHalfAt(widest) / 2);
  });
});

/**
 * A member that ends inside another part has two ways to be wrong and both are quiet: it can
 * push out through the far side, or fall short and leave the parts floating apart. This is the
 * one place on the chair where that happens, and it shipped wrong — a rounded bump stood proud
 * of the armpad, exactly where a forearm rests.
 */
describe("where the arm ends", () => {
  const bandOf = (z: number): number => Math.round(z * 200);

  it("buries the stem inside the pad rather than pushing it through the top", () => {
    const pad = points(PARTS.pads).filter((point) => point.x > 0.2);
    const top = new Map<number, number>();
    const bottom = new Map<number, number>();
    for (const point of pad) {
      const band = bandOf(point.z);
      top.set(band, Math.max(top.get(band) ?? -Infinity, point.y));
      bottom.set(band, Math.min(bottom.get(band) ?? Infinity, point.y));
    }

    let deepest = Infinity;
    let highest = -Infinity;
    for (const point of points(PARTS.frame)) {
      if (point.x < 0.2 || point.y < 0.66) continue;
      const above = top.get(bandOf(point.z));
      const under = bottom.get(bandOf(point.z));
      if (above === undefined || under === undefined) continue;
      deepest = Math.min(deepest, above - point.y);
      highest = Math.max(highest, point.y - under);
    }

    expect(deepest).toBeGreaterThan(0.01);
    expect(highest).toBeGreaterThan(0.005);
  });
});

describe("the base", () => {
  it("spreads five legs evenly, each reaching the measured radius", () => {
    const turns = legTurns();

    expect(turns).toHaveLength(5);
    for (let index = 1; index < turns.length; index += 1) {
      expect.soft(turns[index]! - turns[index - 1]!).toBeCloseTo((Math.PI * 2) / 5, 10);
    }
    const reach = Math.max(...points(PARTS.frame).map((point) => Math.hypot(point.x, point.z)));
    expect(reach).toBeCloseTo(AERON.baseRadius, 1);
  });

  it("hangs a pair of wheels off every leg, behind the pivot they swivel on", () => {
    const wheels = points(PARTS.wheels);
    const clusters = new Set(
      wheels.map((point) => Math.round((Math.atan2(point.x, point.z) / (Math.PI * 2)) * 5)),
    );

    expect(clusters.size).toBeLessThanOrEqual(BASE.legs);
    // The trail is what makes a caster a caster: the axle sits behind the stem it hangs from,
    // by enough that a wheel swivels to follow the chair instead of scrubbing sideways.
    const axleReach =
      wheels.reduce((total, point) => total + Math.hypot(point.x, point.z), 0) / wheels.length;
    expect(axleReach).toBeCloseTo(AERON.baseRadius - BASE.trail, 2);
  });
});

describe("where it is parked", () => {
  const placed = (sheets: readonly Sheet[]): readonly Vector3[] =>
    points(sheets).map((point) =>
      point
        .multiplyScalar(CHAIR_PLACEMENT.scale)
        .applyAxisAngle(new Vector3(0, 1, 0), CHAIR_PLACEMENT.turn)
        .add(new Vector3(CHAIR_PLACEMENT.x, 0, CHAIR_PLACEMENT.z)),
    );

  /**
   * The chair is measured at 1:1 but parked oversized, so the real 21 cm of leg room is not
   * what holds any more. What does is the ceiling that scale factor has: the seat crown still
   * has to pass under the desk's underside, or the chair reads as one that could never be
   * rolled in — and it still has to sit well below the working surface.
   */
  it("stands taller than the real chair and still passes under this desk", () => {
    const seat = AERON.seatY * CHAIR_PLACEMENT.scale;

    expect(seat).toBeGreaterThan(AERON.seatY);
    expect(seat).toBeLessThan(DESK_LEG_HEIGHT);
    expect(DESK_TOP_Y - seat).toBeGreaterThan(0.05);
  });

  it("never puts anything at desk height through the desk", () => {
    const frontEdge = DESK_DEPTH / 2;

    for (const sheets of [PARTS.frame, PARTS.pads, PARTS.back, PARTS.seat]) {
      for (const point of placed(sheets)) {
        if (point.y < DESK_TOP_Y - 0.06) continue;
        expect.soft(point.z).toBeGreaterThan(frontEdge);
      }
    }
  });
});

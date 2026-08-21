import { describe, expect, it } from "vitest";
import { Box3, Vector3, type BufferGeometry } from "three";
import { createShell } from "./shell";
import {
  createUpholstery,
  cushionSheets,
  SOFA,
  SOFA_BLOCKS,
  SOFA_FEET,
  type Cushion,
} from "./sofa";

/**
 * What a look at the render cannot tell you about a merged parametric surface, and what a
 * plausible-looking sofa hides: which way its faces point, which end the chaise is on, and
 * whether the footprint it publishes is the one it occupies.
 *
 * Read off the finished geometry wherever a claim is about the surface. The bulge and the
 * back's lean carry that surface a centimeter or two past the boxes the model is written
 * with, and the lounge's clearances are measured against the surface — so an assertion
 * against the source numbers would be agreeing with the wrong half of the file.
 *
 * The sofa's own frame: `x` runs along the wall, `y` up from the floor, and the back face is
 * at `z = 0` with the front toward `-z` — the room's television is at `-z`, so the piece is
 * built facing it and is never turned.
 */

const EPSILON = 1e-6;
const upholstery = createUpholstery();

function boundsOf(geometry: BufferGeometry): Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox ?? new Box3();
}

/** How far forward the surface reaches over one stretch of the run. */
function reachAt(from: number, to: number): number {
  const position = upholstery.getAttribute("position");
  let front = 0;
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const x = position.getX(vertex);
    if (x < from || x > to) continue;
    front = Math.min(front, position.getZ(vertex));
  }
  return front;
}

describe("the sectional", () => {
  const box = boundsOf(upholstery);

  it("occupies the footprint it publishes, centered on the room's own zero", () => {
    expect(box.max.x - box.min.x).toBeCloseTo(SOFA.width, 5);
    expect(box.min.x).toBeCloseTo(-SOFA.width / 2, 5);
    expect(box.max.y).toBeCloseTo(SOFA.backTop, 5);
    expect(box.min.z).toBeCloseTo(-SOFA.depth, 5);
  });

  /**
   * The lounge places the piece by its back face and reads the room's clearances from there,
   * so the surface has to stop at zero — not the boxes the surface was grown from, which the
   * bulge carries a centimeter behind. The layout pays for that by sliding the whole
   * sectional forward, and this is the assertion that says it paid exactly.
   */
  it("stops at its own back face rather than bulging through it", () => {
    expect(box.max.z).toBeLessThanOrEqual(EPSILON);
    expect(box.max.z).toBeGreaterThan(-EPSILON);
  });

  /**
   * The whole point of the piece. The chaise turns the corner at `+x` — the wall end, away
   * from the camera that frames the television — and reaches half a meter further into the
   * room than the run does. Mirrored, it stands between that camera and the screen, and every
   * other assertion in this file still passes.
   */
  it("turns the corner at the wall end and nowhere else", () => {
    const half = SOFA.width / 2;

    expect(reachAt(half / 2, half)).toBeCloseTo(-SOFA.depth, 5);
    expect(reachAt(-half / 2, 0)).toBeCloseTo(-SOFA.runDepth, 5);
    expect(reachAt(-half, -half + 0.15)).toBeGreaterThan(-SOFA.runDepth);
    expect(SOFA.depth).toBeGreaterThan(SOFA.runDepth + 0.4);
  });

  it("stands the whole piece on the floor, seats below backs", () => {
    expect(SOFA.seatTop).toBeLessThan(SOFA.backTop);
    expect(box.min.y).toBeGreaterThan(0);
    for (const [, y] of SOFA_FEET) expect(y).toBeGreaterThan(0);
  });

  /**
   * Modules that touch read as one bench, so the gap between them is the shadow that makes
   * this a sectional. It is asserted on every neighboring pair of bases rather than on the
   * constant they come from — a module widened by hand is how the gap goes.
   */
  it("stands every module clear of its neighbor", () => {
    const bases = SOFA_BLOCKS.filter((block) => block.center[1] < SOFA.seatTop / 2).sort(
      (a, b) => a.center[0] - b.center[0],
    );

    expect(bases.length).toBeGreaterThan(3);
    for (let index = 1; index < bases.length; index += 1) {
      const left = bases[index - 1]!;
      const right = bases[index]!;
      expect(
        right.center[0] - right.size[0] / 2 - (left.center[0] + left.size[0] / 2),
      ).toBeGreaterThan(0.01);
    }
  });

  it("stands every foot under the piece", () => {
    expect(SOFA_FEET.length).toBeGreaterThan(SOFA_BLOCKS.length / 2);
    for (const [x, , z] of SOFA_FEET) {
      expect(Math.abs(x)).toBeLessThan(SOFA.width / 2);
      expect(z).toBeLessThan(0);
      expect(z).toBeGreaterThan(-SOFA.depth);
    }
  });

  /**
   * A sheet skinned the wrong way round renders as a cushion-shaped hole and throws nothing —
   * the one defect here that no screenshot from across the room would show. The signed volume
   * of a closed surface is positive only when its faces point outward, so this catches a
   * reversed cap as readily as a reversed shell.
   */
  it("winds every face outward", () => {
    const position = upholstery.getAttribute("position");
    const index = upholstery.getIndex();
    if (!index) throw new Error("The upholstery came out unindexed");

    const a = new Vector3();
    const b = new Vector3();
    const c = new Vector3();
    let volume = 0;
    for (let corner = 0; corner < index.count; corner += 3) {
      a.fromBufferAttribute(position, index.getX(corner));
      b.fromBufferAttribute(position, index.getX(corner + 1));
      c.fromBufferAttribute(position, index.getX(corner + 2));
      volume += a.dot(b.clone().cross(c)) / 6;
    }

    expect(volume).toBeGreaterThan(0);
  });
});

/** The reach across `x` of every vertex within a millimeter of one height. */
function widthAt(geometry: BufferGeometry, y: number): number {
  const position = geometry.getAttribute("position");
  let widest = 0;
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    if (Math.abs(position.getY(vertex) - y) > 0.001) continue;
    widest = Math.max(widest, Math.abs(position.getX(vertex)));
  }
  return widest * 2;
}

describe("one cushion", () => {
  const cushion: Cushion = {
    center: [0, 0, 0],
    size: [0.6, 0.2, 0.5],
    planRadius: 0.05,
    rollRadius: 0.07,
    bottomRoll: 0.02,
    bulge: 0.012,
  };
  const geometry = createShell(cushionSheets(cushion));

  /**
   * The three numbers that separate upholstery from a rounded box, which one radius cannot
   * say: the top rolls over generously, the bottom barely breaks — a block rolled as softly
   * underneath as on top pinches into a waist where it stands on the next one — and the middle
   * barrels out past the box it was grown from.
   */
  it("rolls its top, sits its bottom flat and barrels its middle", () => {
    expect(widthAt(geometry, 0.1)).toBeCloseTo(0.6 - 2 * 0.07, 2);
    expect(widthAt(geometry, -0.1)).toBeCloseTo(0.6 - 2 * 0.02, 2);
    expect(widthAt(geometry, 0)).toBeCloseTo(0.6 + 2 * 0.012, 2);
  });

  /** A closed surface: the caps are what make it one, and a missing cap is a hollow shell. */
  it("closes at both ends", () => {
    const box = boundsOf(geometry);

    expect(box.max.y).toBeCloseTo(0.1, 5);
    expect(box.min.y).toBeCloseTo(-0.1, 5);
    expect(cushionSheets(cushion)).toHaveLength(3);
  });
});

import { describe, expect, it } from "vitest";
import { Box3, Vector3 } from "three";

import {
  BODY_LIFT,
  createBodyGeometry,
  createDisplayGeometry,
  DISPLAY,
  PHONE,
  phoneOutline,
} from "./phone";

/**
 * The measurements that make a rectangle read as this phone, none of which fails loudly.
 * `ExtrudeGeometry` grows its section outward by the bevel and starts below zero, so a body
 * fed the finished outline comes out oversized and sunk into the desk — and renders as a
 * plausible slab either way. The corner is the other one: a circular arc of the right radius
 * still throws no error, it just stops being an iPhone.
 */

function boundsOf(geometry: { computeBoundingBox: () => void; boundingBox: Box3 | null }): Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox ?? new Box3();
}

/**
 * How far the top-right corner's own points stand from the center of its arc, as a share of
 * the radius. Only that corner reaches the quadrant beyond its center, so the filter selects
 * it without the outline having to say where one corner ends.
 */
function cornerReach(inset = 0): number {
  const radius = PHONE.cornerRadius - inset;
  const x = PHONE.width / 2 - inset - radius;
  const y = PHONE.length / 2 - inset - radius;

  return Math.max(
    ...phoneOutline(inset)
      .filter((point) => point.x >= x && point.y >= y)
      .map((point) => Math.hypot(point.x - x, point.y - y) / radius),
  );
}

/**
 * Measured in the geometry's own frame, which is the shape's: `x` is the phone's width, `y`
 * its length, and the extrusion runs up `z`. The mesh turns it a quarter so `z` becomes
 * height — asserting the turned mesh would be asserting R3F rather than the model.
 */
describe("the phone's shell", () => {
  it("comes out the size of the phone rather than the size of its profile", () => {
    const size = boundsOf(createBodyGeometry()).getSize(new Vector3());

    expect(size.x).toBeCloseTo(PHONE.width, 6);
    expect(size.y).toBeCloseTo(PHONE.length, 6);
    expect(size.z).toBeCloseTo(PHONE.thickness, 6);
  });

  /** The extrusion runs from `-bevelThickness`, so the lift is what stands it on the desk. */
  it("lies on the desk instead of sinking a chamfer into it", () => {
    const body = boundsOf(createBodyGeometry());

    expect(body.min.z + BODY_LIFT).toBeCloseTo(0, 6);
    expect(body.max.z + BODY_LIFT).toBeCloseTo(PHONE.thickness, 6);
  });

  it("draws an outline the size of the phone, centered on it", () => {
    const points = phoneOutline();
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    expect(Math.max(...xs)).toBeCloseTo(PHONE.width / 2, 6);
    expect(Math.min(...xs)).toBeCloseTo(-PHONE.width / 2, 6);
    expect(Math.max(...ys)).toBeCloseTo(PHONE.length / 2, 6);
    expect(Math.min(...ys)).toBeCloseTo(-PHONE.length / 2, 6);
  });

  /**
   * The corner, and the whole reason this profile is sampled rather than arced. A circular
   * corner never leaves its own radius; this one bulges past it towards the diagonal, which
   * is what carries the curvature on into the straight edge instead of meeting it at a step.
   */
  it("turns the corner on a curve fuller than a circle's", () => {
    expect(cornerReach()).toBeGreaterThan(1.1);
    // Past about 1.4 the corner has straightened into a chamfer with two kinks in it.
    expect(cornerReach()).toBeLessThan(1.4);
  });

  /**
   * The glass and the display are the same outline stepped inward, which is what makes their
   * corners look like they belong to the body's rather than sit inside it.
   */
  it("insets a profile without flattening its corner", () => {
    const inset = 0.004;

    expect(Math.max(...phoneOutline(inset).map((point) => point.x))).toBeCloseTo(
      PHONE.width / 2 - inset,
      6,
    );
    expect(cornerReach(inset)).toBeCloseTo(cornerReach(), 6);
  });
});

describe("the phone's display", () => {
  it("maps the home screen across the panel instead of tiling it", () => {
    const geometry = createDisplayGeometry();
    const uv = geometry.getAttribute("uv");
    const us: number[] = [];
    const vs: number[] = [];

    for (let index = 0; index < uv.count; index += 1) {
      us.push(uv.getX(index));
      vs.push(uv.getY(index));
    }

    expect(Math.min(...us)).toBeCloseTo(0, 5);
    expect(Math.max(...us)).toBeCloseTo(1, 5);
    expect(Math.min(...vs)).toBeCloseTo(0, 5);
    expect(Math.max(...vs)).toBeCloseTo(1, 5);
  });

  /** A canvas of a different ratio than the panel paints the whole home screen stretched. */
  it("is painted on a canvas of its own shape", () => {
    expect(DISPLAY.canvasAspect / DISPLAY.aspect).toBeCloseTo(1, 2);
  });
});

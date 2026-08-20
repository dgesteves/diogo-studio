import { describe, expect, it } from "vitest";
import { Box3, Vector3 } from "three";

import { DISPLAY as PHONE_DISPLAY, PHONE } from "./phone";
import { createSlabBody, createSlabFace, slabOutline, type SlabSpec } from "./slab";
import { DISPLAY as TABLET_DISPLAY, TABLET } from "./tablet";

/**
 * The measurements that make a rectangle read as one of these two devices, none of which
 * fails loudly. `ExtrudeGeometry` grows its section outward by the bevel and starts below
 * zero, so a body fed the finished outline comes out oversized and sunk into the desk — and
 * renders as a plausible slab either way. The corner is the other one: a circular arc of the
 * right radius still throws no error, it just stops being an iPhone or an iPad.
 */

const DEVICES: readonly (readonly [string, SlabSpec])[] = [
  ["the phone", PHONE],
  ["the tablet", TABLET],
];

function boundsOf(geometry: { computeBoundingBox: () => void; boundingBox: Box3 | null }): Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox ?? new Box3();
}

/**
 * How far the top-right corner's own points stand from the center of its arc, as a share of
 * the radius. Only that corner reaches the quadrant beyond its center, so the filter selects
 * it without the outline having to say where one corner ends.
 */
function cornerReach(spec: SlabSpec, inset = 0): number {
  const radius = spec.cornerRadius - inset;
  const x = spec.width / 2 - inset - radius;
  const y = spec.length / 2 - inset - radius;

  return Math.max(
    ...slabOutline(spec, inset)
      .filter((point) => point.x >= x && point.y >= y)
      .map((point) => Math.hypot(point.x - x, point.y - y) / radius),
  );
}

/**
 * Measured in the geometry's own frame, which is the shape's: `x` is the device's width, `y`
 * its length, and the extrusion runs up `z`. The mesh turns it a quarter so `z` becomes
 * height — asserting the turned mesh would be asserting R3F rather than the model.
 */
describe.each(DEVICES)("%s's shell", (_name, spec) => {
  it("comes out the size of the device rather than the size of its profile", () => {
    const size = boundsOf(createSlabBody(spec)).getSize(new Vector3());

    expect(size.x).toBeCloseTo(spec.width, 6);
    expect(size.y).toBeCloseTo(spec.length, 6);
    expect(size.z).toBeCloseTo(spec.thickness, 6);
  });

  /** The extrusion runs from `-bevelThickness`, so the lift is what stands it on the desk. */
  it("lies on the desk instead of sinking a chamfer into it", () => {
    const body = boundsOf(createSlabBody(spec));

    expect(body.min.z + spec.fillet).toBeCloseTo(0, 6);
    expect(body.max.z + spec.fillet).toBeCloseTo(spec.thickness, 6);
  });

  it("draws an outline the size of the device, centered on it", () => {
    const points = slabOutline(spec);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    expect(Math.max(...xs)).toBeCloseTo(spec.width / 2, 6);
    expect(Math.min(...xs)).toBeCloseTo(-spec.width / 2, 6);
    expect(Math.max(...ys)).toBeCloseTo(spec.length / 2, 6);
    expect(Math.min(...ys)).toBeCloseTo(-spec.length / 2, 6);
  });

  /**
   * The corner, and the whole reason this profile is sampled rather than arced. A circular
   * corner never leaves its own radius; this one bulges past it towards the diagonal, which
   * is what carries the curvature on into the straight edge instead of meeting it at a step.
   */
  it("turns the corner on a curve fuller than a circle's", () => {
    expect(cornerReach(spec)).toBeGreaterThan(1.1);
    // Past about 1.4 the corner has straightened into a chamfer with two kinks in it.
    expect(cornerReach(spec)).toBeLessThan(1.4);
  });

  /**
   * The glass and the display are the same outline stepped inward, which is what makes their
   * corners look like they belong to the body's rather than sit inside it.
   */
  it("insets a profile without flattening its corner", () => {
    const inset = 0.004;

    expect(Math.max(...slabOutline(spec, inset).map((point) => point.x))).toBeCloseTo(
      spec.width / 2 - inset,
      6,
    );
    expect(cornerReach(spec, inset)).toBeCloseTo(cornerReach(spec), 6);
  });

  it("maps a home screen across the panel instead of tiling it", () => {
    const uv = createSlabFace(spec, 0.003).getAttribute("uv");
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
});

/** A canvas of a different ratio than the panel paints the whole home screen stretched. */
describe.each([
  ["the phone", PHONE_DISPLAY],
  ["the tablet", TABLET_DISPLAY],
])("%s's display", (_name, display) => {
  it("is painted on a canvas of its own shape", () => {
    expect(display.canvasAspect / display.aspect).toBeCloseTo(1, 2);
  });
});

/**
 * The two devices are the same object at two sizes, and the size is what tells them apart on
 * the desk: a tablet whose bezel had been copied from the phone would read as a phone that
 * had been scaled up, which is the failure this whole pair of files exists to avoid.
 */
it("gives the tablet the wider border of the two", () => {
  const phoneBorder = (PHONE.width - PHONE_DISPLAY.width) / 2;
  const tabletBorder = (TABLET.width - TABLET_DISPLAY.width) / 2;

  expect(tabletBorder).toBeGreaterThan(phoneBorder * 3);
});

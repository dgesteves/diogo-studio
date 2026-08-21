import { describe, expect, it } from "vitest";

import { createShell, sampleCurve, smoothStep, type Sheet } from "./shell";
import { Vector3 } from "three";

/**
 * The primitive the molded objects in this room are skinned with. It is measured curves and
 * a grid, so its failures are quiet ones: an interpolant that overshoots turns a deliberate
 * step into a bulge, and a sheet list that shares an index base welds two parts together.
 */

describe("the measured curves a shell is read off", () => {
  const knots = [
    [0, 0.2],
    [0.4, 0.9],
    [0.7, 0.9],
    [1, 0.1],
  ] as const;

  it("passes through every measurement it was given", () => {
    for (const [at, value] of knots) expect(sampleCurve(knots, at)).toBeCloseTo(value, 10);
  });

  it("holds the ends flat instead of extrapolating past them", () => {
    expect(sampleCurve(knots, -1)).toBe(0.2);
    expect(sampleCurve(knots, 2)).toBe(0.1);
  });

  // Several tables hold a deliberate step, and an interpolant that overshoots one puts a
  // bulge on either side of it — a lip around the mouse's wheel slot, a waist in a chair back.
  it("never overshoots a segment, so a step stays a step", () => {
    for (let step = 0; step <= 200; step += 1) {
      const at = step / 200;
      expect.soft(sampleCurve(knots, at)).toBeLessThanOrEqual(0.9 + 1e-12);
      expect.soft(sampleCurve(knots, at)).toBeGreaterThanOrEqual(0.1 - 1e-12);
    }
  });

  it("eases between its two ends and clamps outside them", () => {
    expect(smoothStep(0, 1, -1)).toBe(0);
    expect(smoothStep(0, 1, 2)).toBe(1);
    expect(smoothStep(0, 1, 0.5)).toBeCloseTo(0.5, 12);
  });
});

describe("skinning sheets into one geometry", () => {
  const flat = (rows: number, columns: number): Sheet => ({
    rows,
    columns,
    point: (u, v) => new Vector3(v, 0, u),
  });

  it("indexes every sheet against its own vertices, so parts stay separate", () => {
    const together = createShell([flat(2, 2), flat(2, 2)]);
    const alone = createShell([flat(2, 2)]);
    const count = alone.getAttribute("position").count;

    expect(together.getAttribute("position").count).toBe(count * 2);
    // The second sheet's triangles must not reach back into the first one's vertices: a
    // shared base is how two separate moldings end up welded along an invisible strip.
    expect(Math.min(...Array.from(together.getIndex()!.array).slice(-6))).toBeGreaterThanOrEqual(
      count,
    );
  });

  it("computes a finite normal for every vertex", () => {
    const normals = Array.from(createShell([flat(4, 4)]).getAttribute("normal").array);

    expect(normals.length).toBeGreaterThan(0);
    expect(normals.every(Number.isFinite)).toBe(true);
  });

  /** Cosine spacing bunches samples where a surface turns; even spacing wastes them there. */
  it("clusters samples toward both ends of an axis when asked", () => {
    const even = createShell([{ ...flat(8, 1) }]).getAttribute("position");
    const clustered = createShell([{ ...flat(8, 1), clusterRows: true }]).getAttribute("position");
    const firstStep = (attribute: typeof even): number =>
      Math.abs(attribute.getZ(2) - attribute.getZ(0));

    expect(firstStep(clustered)).toBeLessThan(firstStep(even));
  });
});

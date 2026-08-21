import type { Vector3 } from "three";
import { BufferGeometry, Float32BufferAttribute } from "three";

/**
 * How a molded object is built in this room: a list of parametric sheets skinned into one
 * indexed geometry.
 *
 * It was the mouse's private primitive first, and the reasoning is `scene/mouse.tsx`'s —
 * normals are computed per geometry, so a sheet is smooth inside itself and every sheet
 * boundary is a hard edge. Picking where the sheets end is how these files spell "crease",
 * which is why neither of them needs a seam mesh. The chair is the second caller, so it
 * moved here rather than being copied, the way `scene/slab.ts` was split out of the phone.
 *
 * Nothing in here knows what it is drawing. The measurements stay with the object.
 */

/**
 * A measured curve: a table of (position, value) read off the reference, sampled with a
 * monotone cubic. Monotone rather than plain Catmull-Rom because several of these tables
 * hold a deliberate step — a wheel slot opening, a chair back flaring to full width in
 * three centimeters — and an interpolant that overshoots would put a bulge on either side.
 */
export type Knot = readonly [at: number, value: number];

function slopeAt(knots: readonly Knot[], index: number): number {
  const before = knots[index - 1] ?? knots[index];
  const after = knots[index + 1] ?? knots[index];
  if (!before || !after) return 0;
  const run = after[0] - before[0];
  return run === 0 ? 0 : (after[1] - before[1]) / run;
}

/** Fritsch–Carlson limiting: a tangent that fights the segment's own direction is dropped. */
function limitedSlope(slope: number, delta: number): number {
  if (delta === 0 || slope * delta <= 0) return 0;
  return Math.abs(slope) > 3 * Math.abs(delta) ? 3 * delta : slope;
}

export function sampleCurve(knots: readonly Knot[], at: number): number {
  const first = knots[0];
  const last = knots[knots.length - 1];
  if (!first || !last) return 0;
  if (at <= first[0]) return first[1];
  if (at >= last[0]) return last[1];

  let index = 0;
  while ((knots[index + 1]?.[0] ?? Number.POSITIVE_INFINITY) < at) index += 1;
  const start = knots[index];
  const end = knots[index + 1];
  if (!start || !end) return last[1];

  const span = end[0] - start[0];
  const step = (at - start[0]) / span;
  const delta = (end[1] - start[1]) / span;
  const from = limitedSlope(slopeAt(knots, index), delta) * span;
  const to = limitedSlope(slopeAt(knots, index + 1), delta) * span;
  const squared = step * step;
  const cubed = squared * step;

  return (
    (2 * cubed - 3 * squared + 1) * start[1] +
    (cubed - 2 * squared + step) * from +
    (-2 * cubed + 3 * squared) * end[1] +
    (cubed - squared) * to
  );
}

export function smoothStep(from: number, to: number, value: number): number {
  const blend = Math.min(Math.max((value - from) / (to - from), 0), 1);
  return blend * blend * (3 - 2 * blend);
}

/**
 * A parametric sheet: a rectangular grid evaluated through `point`. A shell, a wall, a
 * stretched panel and the wrap of a swept tube are all one of these.
 */
export type Sheet = {
  readonly rows: number;
  readonly columns: number;
  readonly point: (u: number, v: number) => Vector3;
  /** Cosine spacing, which bunches samples at both ends of the axis — where surfaces turn. */
  readonly clusterRows?: boolean;
  readonly clusterColumns?: boolean;
};

function stepAt(index: number, count: number, cluster: boolean): number {
  const even = index / count;
  return cluster ? 0.5 - 0.5 * Math.cos(Math.PI * even) : even;
}

export function createShell(sheets: readonly Sheet[]): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  for (const sheet of sheets) {
    const base = positions.length / 3;
    const stride = sheet.columns + 1;
    for (let row = 0; row <= sheet.rows; row += 1) {
      const u = stepAt(row, sheet.rows, sheet.clusterRows ?? false);
      for (let column = 0; column <= sheet.columns; column += 1) {
        const v = stepAt(column, sheet.columns, sheet.clusterColumns ?? false);
        const { x, y, z } = sheet.point(u, v);
        positions.push(x, y, z);
        if (row === 0 || column === 0) continue;
        const corner = base + row * stride + column;
        const behind = corner - stride;
        indices.push(behind - 1, behind, corner - 1, behind, corner, corner - 1);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

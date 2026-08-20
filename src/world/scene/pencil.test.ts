import { describe, expect, it } from "vitest";
import { Box3, Vector3, type BufferGeometry } from "three";

import { createPencilBody, createPencilNib, PENCIL } from "./pencil";

/**
 * The measurements that make a barrel read as an Apple Pencil rather than as a dowel, none of
 * which fails loudly. A flat cut to the wrong width is still a flat; a body that gives up its
 * width over the last quarter of its length is still a stylus, just a fineliner-shaped one; and
 * a flat carrying the barrel's averaged normals disappears altogether while every triangle in
 * it stays exactly where it was.
 */

function boundsOf(geometry: BufferGeometry): Box3 {
  geometry.computeBoundingBox();
  return geometry.boundingBox ?? new Box3();
}

/**
 * The barrel's radius at each ring, keyed by how far along the axis that ring sits. `y` is the
 * one axis the flat never touches, so the widest `y` in a ring is that ring's true radius.
 */
function ringRadii(geometry: BufferGeometry): Map<number, number> {
  const position = geometry.getAttribute("position");
  const radii = new Map<number, number>();

  for (let index = 0; index < position.count; index += 1) {
    const along = position.getZ(index);
    radii.set(along, Math.max(radii.get(along) ?? 0, Math.abs(position.getY(index))));
  }

  return radii;
}

/** Every vertex lying on the planed side, as `[along, across]` in the section's own frame. */
function planedVertices(geometry: BufferGeometry): [number, number][] {
  const position = geometry.getAttribute("position");
  const planed: [number, number][] = [];

  for (let index = 0; index < position.count; index += 1) {
    if (position.getX(index) > PENCIL.flatOffset - 1e-9) {
      planed.push([position.getZ(index), position.getY(index)]);
    }
  }

  return planed;
}

describe("the pencil's barrel", () => {
  it("comes out the length of the device, tail at the origin", () => {
    const body = boundsOf(createPencilBody());
    const nib = boundsOf(createPencilNib());

    expect(body.min.z).toBeCloseTo(0, 6);
    expect(body.max.z).toBeCloseTo(PENCIL.nibAt, 6);
    expect(nib.min.z).toBeCloseTo(PENCIL.nibAt, 6);
    expect(nib.max.z).toBeCloseTo(PENCIL.length, 6);
  });

  /**
   * A diameter across the round way and a chord's less across the planed one — which is the
   * flat, stated as a size rather than as a shape.
   */
  it("is a diameter one way and a chord short of one the other", () => {
    const size = boundsOf(createPencilBody()).getSize(new Vector3());

    expect(size.y).toBeCloseTo(PENCIL.radius * 2, 6);
    expect(size.x).toBeCloseTo(PENCIL.radius + PENCIL.flatOffset, 6);
  });

  /**
   * The section is sampled by angle, so the two vertices nearest a corner of the chord land a
   * fraction of a segment inside it: the polygon reaches the full width, the vertices sitting
   * exactly on the plane do not. One segment is therefore the tolerance that means anything
   * here, and it is the sampling's own number rather than a tuned one.
   */
  it("cuts the flat to the width it is measured at", () => {
    const across = planedVertices(createPencilBody()).map(([, y]) => Math.abs(y));
    const segment = (2 * Math.PI * PENCIL.radius) / PENCIL.segments;

    expect(Math.max(...across) * 2).toBeLessThanOrEqual(PENCIL.flatWidth + 1e-9);
    expect(Math.max(...across) * 2).toBeGreaterThan(PENCIL.flatWidth - segment * 2);
  });

  it("planes one side and leaves the other round", () => {
    expect(boundsOf(createPencilBody()).min.x).toBeCloseTo(-PENCIL.radius, 6);
  });

  /**
   * The flat is a consequence of the cut, not a length someone typed: it ends where the taper
   * takes the barrel inside the cutting plane, which is partway down the shoulder and nowhere
   * near the nib.
   */
  it("runs the flat out inside the taper, and never onto the nib", () => {
    const ends = Math.max(...planedVertices(createPencilBody()).map(([along]) => along));

    expect(ends).toBeGreaterThan(PENCIL.taperAt);
    expect(ends).toBeLessThan(PENCIL.nibAt);
    expect(planedVertices(createPencilNib())).toHaveLength(0);
  });

  /**
   * Averaged normals roll the flat back into the barrel and the object is a dowel again, with
   * every vertex still exactly where it belongs — so the normal is the assertion.
   */
  it("faces the flat the way the plane does rather than the way the barrel does", () => {
    const geometry = createPencilBody();
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");

    for (let index = 0; index < position.count; index += 1) {
      if (position.getX(index) > PENCIL.flatOffset - 1e-9) {
        expect(normal.getX(index)).toBeCloseTo(1, 6);
        expect(normal.getY(index)).toBeCloseTo(0, 6);
      }
    }
  });
});

describe("the pencil's profile", () => {
  /**
   * The first thing this got wrong. Taper the barrel over the last quarter of its length and
   * what comes out is a fineliner: the real device runs full width almost to the end and gives
   * up its width in about a centimeter.
   */
  it("holds full width to within a tenth of its length of the tip", () => {
    const radii = ringRadii(createPencilBody());
    const held = [...radii].filter(([, radius]) => radius > PENCIL.radius * 0.99);

    expect(Math.max(...held.map(([along]) => along))).toBeGreaterThan(PENCIL.length * 0.85);
  });

  /** It writes on glass, so the nib ends in a stub rather than in a needle. */
  it("ends the nib blunt", () => {
    const radii = [...ringRadii(createPencilNib())]
      .filter(([along]) => along > PENCIL.length - PENCIL.nibTip * 1.5)
      .map(([, radius]) => radius);

    expect(Math.max(...radii)).toBeGreaterThanOrEqual(PENCIL.nibTip * 0.99);
  });
});

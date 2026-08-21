import { describe, expect, it } from "vitest";
import { Box3, Vector3 } from "three";

import { PAD_Z, REMOTE, REMOTE_PRINT } from "./remote";
import { createSlabBody, createSlabFace } from "./slab";

/**
 * The remote is `slab.ts`'s shape at its own measurements, so its geometry is already covered
 * by `slab.test.ts`. What is left is the two things that are this object's own and that no
 * other assertion would catch.
 */
describe("the remote", () => {
  it("is the size of the device rather than the size of its outline", () => {
    const body = createSlabBody(REMOTE);
    body.computeBoundingBox();
    const size = (body.boundingBox ?? new Box3()).getSize(new Vector3());

    expect(size.x).toBeCloseTo(REMOTE.width, 6);
    expect(size.y).toBeCloseTo(REMOTE.length, 6);
    expect(size.z).toBeCloseTo(REMOTE.thickness, 6);
  });

  /**
   * The one that silently renders a plausible remote with its clickpad rim in the wrong place.
   * The field is measured from the top of the printed face, and `FACE_UP` turns the shape's
   * `+y` — its top — toward `-z`, so the two axes run opposite ways: a modeled ring placed
   * with the sign the layout is written in lands on the blank third at the other end, which
   * from anywhere in the lounge is a rim around nothing.
   */
  it("places the modeled clickpad rim over the printed one, not opposite it", () => {
    // The pad is in the top third of a face measured from its top, so it must land on the
    // half of the object the face's `v = 1` edge does.
    expect(PAD_Z).toBeLessThan(0);
    expect(PAD_Z).toBeGreaterThan(-REMOTE.length / 2);
  });

  /** The print is laid on the face, so a canvas of another aspect stretches the button field. */
  it("prints a canvas of the face's own aspect", () => {
    const face = createSlabFace(REMOTE, 0);
    face.computeBoundingBox();
    const size = (face.boundingBox ?? new Box3()).getSize(new Vector3());

    expect(REMOTE_PRINT.height / REMOTE_PRINT.width).toBeCloseTo(size.y / size.x, 2);
  });
});

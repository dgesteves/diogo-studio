import { describe, expect, it } from "vitest";
import { Box3, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { createSledLoop, type SledSpec } from "./sled";

/**
 * The bent bar two pieces of furniture stand on, read back out of the geometry rather than
 * off a render. What a picture of one shows is a U; what a spec can hold is that the U is a
 * *bar* — a constant section, standing on the floor, open between its bends — because every
 * way of getting this wrong produces something that still looks like a U from across the room.
 */

const SPEC: SledSpec = {
  width: 0.055,
  thickness: 0.014,
  halfRun: 0.3,
  bend: 0.07,
  rise: 0.32,
};

/** The one number the module keeps to itself: how far the bar runs up into the underside. */
const EMBED = 0.002;
const EPSILON = 0.0001;

function boundsOf(spec: SledSpec): Box3 {
  const loop = createSledLoop(spec);
  loop.computeBoundingBox();
  return loop.boundingBox ?? new Box3();
}

describe("createSledLoop", () => {
  /**
   * Both ends of the bar are load-bearing and neither is visible in the shape: a runner that
   * misses the floor is a piece of furniture hovering, and an upright that stops short of the
   * underside leaves a seam of room showing through the join it is supposed to make.
   */
  it("stands the runner on the floor and runs the uprights into the underside", () => {
    const bounds = boundsOf(SPEC);

    expect(bounds.min.y).toBeCloseTo(0, 5);
    expect(bounds.max.y).toBeCloseTo(SPEC.rise + EMBED, 5);
  });

  /**
   * Centered on its own face, so a caller places a loop at the `x` it stands at. It was the
   * caller's job, and a second caller is exactly when that stops being a detail: the desk
   * would have carried its own copy of `- width / 2` and gone half a bar out the day someone
   * changed the section.
   */
  it("centers the bar on the face it is extruded through", () => {
    const bounds = boundsOf(SPEC);
    const size = bounds.getSize(new Vector3());

    expect(bounds.getCenter(new Vector3()).z).toBeCloseTo(0, 5);
    expect(size.z).toBeCloseTo(SPEC.width, 5);
    // The runner, plus the half section standing proud at each end of it.
    expect(size.x).toBeCloseTo(SPEC.halfRun * 2 + SPEC.thickness, 5);
  });

  /**
   * The claim that makes it a sled rather than a panel: between the bends there is nothing but
   * the runner. A solid side, a boxed-in apron and a plinth all pass every assertion above.
   *
   * Fired downward, because a raycast obeys `side` and every upward hit on a closed shell is a
   * back face: the same ray sent the other way passes through a solid panel unscathed.
   */
  it("leaves the span between the bends open", () => {
    const bar = new Mesh(createSledLoop(SPEC), new MeshBasicMaterial());
    bar.updateMatrixWorld();

    const down = new Raycaster(new Vector3(0, SPEC.rise + 0.5, 0), new Vector3(0, -1, 0));
    const hits = down.intersectObject(bar);

    expect(hits.length).toBeGreaterThan(0);
    // The runner, and nothing between it and the underside.
    expect(hits[0]!.point.y).toBeLessThanOrEqual(SPEC.thickness + EPSILON);
  });

  /** The section is the bar. A bend that eats it renders as a pinch, or as a hole. */
  it("keeps the bar's section through the bend", () => {
    const tight = boundsOf({ ...SPEC, bend: SPEC.thickness });
    const size = tight.getSize(new Vector3());

    expect(SPEC.bend).toBeGreaterThan(SPEC.thickness / 2);
    expect(size.x).toBeCloseTo(SPEC.halfRun * 2 + SPEC.thickness, 5);
    expect(tight.min.y).toBeCloseTo(0, 5);
  });
});

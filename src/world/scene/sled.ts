import { ExtrudeGeometry, Shape, type BufferGeometry } from "three";

/**
 * A sled base: one flat bar bent into a U, standing on its own runner and meeting the
 * underside of whatever it carries. Two of them are a piece of furniture — the coffee table
 * in the lounge and the desk both stand on a pair.
 *
 * **Why furniture in this room does not stand on posts.** Four cylindrical legs are what a
 * table has when nobody decided what it is: they read as placeholder, they cut the floor
 * under the top into four holes, and at this scale each one is a 4 cm silhouette that the
 * room's light never resolves. A sled does the opposite — one continuous ribbon per end, bent
 * through two radii, with the top cantilevered past it. What a visitor sees is an unbroken
 * line of floor running under the piece and two thin loops catching the light along their
 * bends, which is the whole trick of the form.
 *
 * So the loop is *one* extruded profile rather than three bars butted together. The bend is
 * where a sled base lives: a mitred corner is a welded frame, and the light that separates the
 * base from the dark floor behind it is the highlight running around those two radii.
 *
 * Nothing in here knows what it is holding up. The measurements stay with the piece, the way
 * `scene/slab.ts` and `scene/shell.ts` leave theirs with the object.
 */

export type SledSpec = {
  /** The bar's face, across the piece — the dimension the profile is extruded through. */
  readonly width: number;
  /** Its section through the bend, which is the thickness the radius has to clear. */
  readonly thickness: number;
  /** Half the runner, front to back. Keep it short of the top's own half depth: it overhangs. */
  readonly halfRun: number;
  /** The bend, on the bar's centerline. Larger than half the section, or the arc inverts. */
  readonly bend: number;
  /** The underside the uprights run up to meet, measured from the floor the runner stands on. */
  readonly rise: number;
};

/** How far the bar runs up into the underside, so the join shows no seam of floor through it. */
const EMBED = 0.002;

/**
 * The loop, drawn as a closed outline in the plane it is bent in: `x` runs front to back and
 * `y` is height, so the profile is a U seen from the side and the extrusion is the bar's face.
 *
 * It is walked as one contour — up the outside of the near upright, around both bends, down
 * the far outside, across the cut top, and back along the inside — because a bent bar has an
 * outer radius and an inner one that differ by its own section. Offsetting a centerline is the
 * only way to keep those two concentric; three rounded boxes butted at the corners give a
 * chamfer on the outside and a notch on the inside, which is the join this shape exists to not
 * have.
 */
function sledProfile(spec: SledSpec): Shape {
  const { thickness, halfRun, bend } = spec;
  const half = thickness / 2;
  // The runner's centerline, set so the bar's underside is the floor rather than through it.
  const bendY = half + bend;
  const outer = bend + half;
  const inner = bend - half;
  const top = spec.rise + EMBED;
  const shape = new Shape();

  shape.moveTo(-halfRun - half, top);
  shape.lineTo(-halfRun - half, bendY);
  shape.absarc(-halfRun + bend, bendY, outer, Math.PI, Math.PI * 1.5, false);
  shape.lineTo(halfRun - bend, 0);
  shape.absarc(halfRun - bend, bendY, outer, Math.PI * 1.5, Math.PI * 2, false);
  shape.lineTo(halfRun + half, top);

  shape.lineTo(halfRun - half, top);
  shape.lineTo(halfRun - half, bendY);
  shape.absarc(halfRun - bend, bendY, inner, 0, -Math.PI / 2, true);
  shape.lineTo(-halfRun + bend, thickness);
  shape.absarc(-halfRun + bend, bendY, inner, -Math.PI / 2, -Math.PI, true);
  shape.lineTo(-halfRun + half, top);
  shape.closePath();

  return shape;
}

/**
 * One geometry for both loops of a piece: they are the same bar, mirrored by placement alone.
 * It is centered on the extrusion, so a caller positions a loop at the `x` it stands at and
 * has no half-width to remember.
 *
 * The bar runs along its own `x` and its face is its own `z`, so how a pair is *arranged* is
 * the caller's: the desk turns both a quarter to lay them across its depth, and the lounge
 * table turns them by ±30° to cross them into an X. That is the whole difference between the
 * two bases, and it is one number at each call site rather than a second primitive.
 */
export function createSledLoop(spec: SledSpec): BufferGeometry {
  const loop = new ExtrudeGeometry(sledProfile(spec), {
    depth: spec.width,
    bevelEnabled: false,
    curveSegments: 10,
  });
  loop.translate(0, 0, -spec.width / 2);
  return loop;
}

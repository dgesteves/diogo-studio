import { ExtrudeGeometry, Shape, ShapeGeometry, Vector2, type BufferGeometry } from "three";

/**
 * The two glass slabs on the desk — the phone by the mouse and the tablet beside the keyboard
 * — are the same object at two sizes, so their shape is built here and their measurements
 * stay with them.
 *
 * What makes one recognizable is not the proportions — a rectangle is a rectangle — but **the
 * corner**. It is not a circular arc: the curvature runs on into the straight edge instead of
 * meeting it at a step, which is why a rounded rectangle of the right radius still reads as a
 * remote control. So the outline is a superellipse corner, sampled once and used three times.
 *
 * The body is that profile extruded rather than a `RoundedBox` — one radius on twelve edges
 * would round the flat sides too and leave a bar of soap where a flat-sided device should be.
 * Three concentric copies of the one outline are the whole object: the aluminum body, the
 * glass inside its rim, and the display inside the bezel. Offsetting a profile keeps the
 * corners concentric, which is what makes the display's corner look like it belongs to the
 * body's — the single thing these get wrong when the screen is a plain rectangle laid on top.
 */

/** In meters, off the real device. `fillet` is the chamfer at the top and bottom of the wall:
 *  a phone or a tablet has flat sides, so it is a break of the edge and not a rounding of it. */
export type SlabSpec = {
  readonly width: number;
  readonly length: number;
  readonly thickness: number;
  readonly cornerRadius: number;
  readonly fillet: number;
};

/**
 * How far the corner departs from a circle. Two is an ellipse and reads as a rounded box; at
 * five the curvature carries into the straight edge, which is the shape being copied here.
 */
const SQUIRCLE_POWER = 5;
const CORNER_STEPS = 14;

/** The four corners, as the sign of the quadrant and the direction the curve is walked in. */
const CORNERS = [
  [1, 1, false],
  [-1, 1, true],
  [-1, -1, false],
  [1, -1, true],
] as const;

/**
 * The outline, as points. One corner curve mirrored into four quadrants, walked so that
 * consecutive corners are joined by the straight edge between them — there is no explicit
 * edge in here, because a polyline already draws one between the last point of one corner
 * and the first point of the next.
 */
export function slabOutline(spec: SlabSpec, inset = 0): Vector2[] {
  const halfWidth = spec.width / 2 - inset;
  const halfLength = spec.length / 2 - inset;
  const radius = Math.max(0.0005, spec.cornerRadius - inset);
  const points: Vector2[] = [];

  for (const [sx, sy, reverse] of CORNERS) {
    for (let step = 0; step <= CORNER_STEPS; step += 1) {
      const along = (reverse ? CORNER_STEPS - step : step) / CORNER_STEPS;
      const angle = (along * Math.PI) / 2;
      const x = radius * Math.cos(angle) ** (2 / SQUIRCLE_POWER);
      const y = radius * Math.sin(angle) ** (2 / SQUIRCLE_POWER);
      points.push(new Vector2(sx * (halfWidth - radius + x), sy * (halfLength - radius + y)));
    }
  }

  return points;
}

function slabProfile(spec: SlabSpec, inset = 0): Shape {
  return new Shape().setFromPoints(slabOutline(spec, inset));
}

/**
 * The body. `ExtrudeGeometry` grows its section outward by the bevel and runs from
 * `-bevelThickness`, so the profile is drawn one chamfer small and the mesh is lifted by one
 * — fed the finished outline instead, a device comes out a millimeter wide and sunk into the
 * desk. `scene/mac-studio.tsx` documents the same two traps at length.
 */
export function createSlabBody(spec: SlabSpec): BufferGeometry {
  return new ExtrudeGeometry(slabProfile(spec, spec.fillet), {
    depth: spec.thickness - spec.fillet * 2,
    bevelEnabled: true,
    bevelSize: spec.fillet,
    bevelThickness: spec.fillet,
    bevelSegments: 3,
  });
}

/**
 * A face laid over the body's top — the glass, or the display inside it — and the one thing
 * `ShapeGeometry` will not do for a textured one: its UVs are the vertex coordinates
 * themselves, which here are meters, so a home screen would tile a hundred times inside a
 * 7 cm panel. They are rewritten to the panel's own box.
 */
export function createSlabFace(spec: SlabSpec, inset: number): BufferGeometry {
  const geometry = new ShapeGeometry(slabProfile(spec, inset));
  const position = geometry.getAttribute("position");
  const width = spec.width - inset * 2;
  const length = spec.length - inset * 2;
  const uv = geometry.getAttribute("uv");

  for (let index = 0; index < position.count; index += 1) {
    uv.setXY(index, position.getX(index) / width + 0.5, position.getY(index) / length + 0.5);
  }
  uv.needsUpdate = true;

  return geometry;
}

/** Laid flat: the profile is drawn in the shape's plane and turned a quarter to face up. */
export const FACE_UP = [-Math.PI / 2, 0, 0] as const;

/**
 * Silver, and metal rather than metallic: nothing in this room supplies an environment map,
 * and a `meshStandardMaterial` at high metalness has only reflections to be lit by — turned
 * up to what a polished frame "should" be, these devices rendered charcoal under bright
 * light, which is a black phone and a black iPad. So the albedo carries the silver and the
 * metalness is kept low enough that the direct lights still reach it. `scene/mac-studio.tsx`
 * lands on the same split from the other side: it is the largest flat face on the desk and
 * had to be darkened to stop it blooming, where these are thin walls seen almost edge-on.
 */
export const SLAB_FRAME = { color: "#c2c8ce", roughness: 0.42, metalness: 0.38 } as const;

/**
 * Cover glass: nearly black, and satin rather than polished — as is the frame above it, which
 * is duller here than a machined frame really is. At a mirror roughness both of them caught
 * the key light as a single hot point and the bloom pass turned it into a flare. This is
 * glass and curved metal under a rig lit for a room, and a specular spike is what that rig
 * does with a polished one.
 */
export const SLAB_GLASS = { color: "#05080c", roughness: 0.42, metalness: 0.3 } as const;

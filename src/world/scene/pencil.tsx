"use client";

import { type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { useDisposable } from "../gpu";
import { DESK_TOP_Y } from "../room";
import { TABLET, TABLET_POSITION, TABLET_TURN } from "./tablet";

/**
 * The Apple Pencil Pro lying along the tablet's right edge, just off it.
 *
 * A stylus is a cylinder, and a cylinder on this desk is a pen, a cable or a table leg. What
 * makes this one an Apple Pencil is **the flat** — the planed side that carries the magnets and
 * keeps it from rolling off a desk, and the only reason it is not a dowel. So the body is a
 * barrel of revolution with that plane cut through it, and the cut is the primitive rather than
 * a groove or a painted stripe.
 *
 * The flat is not a section that runs a stated length and stops: it falls out of the cut. Where
 * the barrel is wider than the plane the section is a D, and where the taper narrows inside it
 * the section is a circle again — so the flat runs out partway down the taper on its own, which
 * is where the real one ends. Nothing here says where.
 *
 * Left off: the engraving down the flat, which is under a pixel at 9 mm across, and the squeeze
 * sensor that makes a Pencil Pro a Pro rather than a second-generation Pencil, which was never
 * visible on any of them. The joint where the nib screws in is not modeled either — the two
 * pieces meet as two materials, and at this size a groove would only alias.
 */

/** In meters, off the real device — 166 × 8.9 mm, of which 6.2 mm is the width of the flat. */
const LENGTH = 0.166;
const RADIUS = 0.00445;
const FLAT_WIDTH = 0.0062;

/** How far the planed side stands off the axis: the chord's own distance from the center, so
 *  the flat comes out that wide by construction rather than by a number typed twice. */
const FLAT_OFFSET = Math.sqrt(RADIUS ** 2 - (FLAT_WIDTH / 2) ** 2);

/**
 * Where the profile changes, measured from the tail. The tail end of this generation is a flat
 * disc rather than a dome — there is no connector on it any more — so it is broken by a chamfer
 * and nothing else.
 */
const TAIL_BREAK = 0.0005;
const TAPER_AT = 0.1445;
const NIB_AT = 0.154;
const NIB_RADIUS = 0.00215;
/** The nib is blunt: it writes on glass, so it ends in a rounded stub rather than a point. */
const NIB_TIP = 0.0006;

/**
 * The shoulder and the nib's cone, both eased rather than straight. A cone drawn straight off
 * the barrel meets it at a visible ring; these leave their wide end nearly parallel to the axis
 * and narrow further along, which is what makes the barrel read as turned from one piece with a
 * tip screwed into it.
 *
 * The shoulder is short on purpose, and was the first thing this got wrong: taper the barrel
 * over the last quarter of its length and what comes out is a fineliner. On the real device the
 * body runs full width almost to the end and gives up its width in about a centimeter.
 */
const TAPER_EASE = 1.5;
const NIB_EASE = 0.72;
const TAPER_STEPS = 12;
const NIB_STEPS = 10;

/** One point on the profile: how far along the axis, and the radius of the barrel there. */
type Ring = readonly [along: number, radius: number];

function sampled(steps: number, from: number, to: number, radiusAt: (u: number) => number): Ring[] {
  return Array.from({ length: steps + 1 }, (_, step): Ring => {
    const u = step / steps;
    return [from + (to - from) * u, radiusAt(u)];
  });
}

/**
 * Both ends close on a ring of no radius, which is what makes the caps free: the strip between
 * a zero ring and its neighbor already fans across the end face, so there is no separate disc to
 * build, to wind the other way round, or to leave a seam against.
 */
const BODY_RINGS: readonly Ring[] = [
  [0, 0],
  [0, RADIUS - TAIL_BREAK],
  [TAIL_BREAK, RADIUS],
  [TAPER_AT, RADIUS],
  ...sampled(
    TAPER_STEPS,
    TAPER_AT,
    NIB_AT,
    (u) => RADIUS - (RADIUS - NIB_RADIUS) * u ** TAPER_EASE,
  ),
];

const NIB_RINGS: readonly Ring[] = [
  ...sampled(
    NIB_STEPS,
    NIB_AT,
    LENGTH - NIB_TIP,
    (u) => NIB_TIP + (NIB_RADIUS - NIB_TIP) * (1 - u) ** NIB_EASE,
  ),
  [LENGTH, 0],
];

/** Around the barrel. It is 9 mm across and seen from a meter off, so this buys a silhouette
 *  with no facets in it for a few hundred triangles. */
const SEGMENTS = 40;

/**
 * The barrel: the rings swept along +Z from the tail at the origin, each one a circle of its own
 * radius with everything past `flatOffset` laid onto that plane. Clamping the coordinate rather
 * than re-sampling the outline keeps every ring the same length, which is what lets the strip
 * between two of them be indexed at all — and a clamped point still lands exactly on the D, so
 * the section is the true shape and not an approximation of it.
 */
function createBarrel(rings: readonly Ring[], flatOffset: number): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const planed: number[] = [];

  for (const [along, radius] of rings) {
    for (let step = 0; step < SEGMENTS; step += 1) {
      const angle = (step / SEGMENTS) * Math.PI * 2;
      const around = radius * Math.cos(angle);
      if (around > flatOffset) planed.push(positions.length / 3);
      positions.push(Math.min(around, flatOffset), radius * Math.sin(angle), along);
    }
  }

  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let step = 0; step < SEGMENTS; step += 1) {
      const here = ring * SEGMENTS + step;
      const next = ring * SEGMENTS + ((step + 1) % SEGMENTS);
      indices.push(here, next, here + SEGMENTS, next, next + SEGMENTS, here + SEGMENTS);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Averaged normals are right everywhere the surface is curved and wrong on the one part of it
  // that is not: they roll the flat into the barrel and the cut disappears, which is the whole
  // object gone. Every planed vertex faces the way the plane does, and the crease then falls in
  // the single segment between the last round vertex and the first flat one.
  const normals = geometry.getAttribute("normal");
  for (const vertex of planed) normals.setXYZ(vertex, 1, 0, 0);

  return geometry;
}

/** The two pieces, each the same sweep over its own stretch of the profile. They are separate
 *  meshes because they are separate parts: the nib unscrews. */
export function createPencilBody(): BufferGeometry {
  return createBarrel(BODY_RINGS, FLAT_OFFSET);
}

export function createPencilNib(): BufferGeometry {
  return createBarrel(NIB_RINGS, FLAT_OFFSET);
}

/**
 * Matte white plastic, which on this desk is the loudest surface in the room: everything else on
 * it is charcoal, and the night palette's bloom takes whatever passes 0.45 luminance. So it is
 * an off-white rather than a white, and rough enough that the key light spreads across the
 * barrel instead of running a hot line down its length.
 */
const PENCIL_BODY = { color: "#d5dade", roughness: 0.68, metalness: 0.06 } as const;

/** The nib, and the one part of the object that is not white. */
const PENCIL_NIB = { color: "#6e767d", roughness: 0.66, metalness: 0.18 } as const;

/**
 * Beside the tablet's right edge, parallel to it and turned with it, level with the middle of
 * its length. The gap is a finger's width — near enough to read as that tablet's pencil, far
 * enough not to look stuck to the side of it, which is where it would be if it were charging.
 */
const GAP = 0.013;
const OFFSET = TABLET.width / 2 + GAP + RADIUS;
const PENCIL_POSITION = [
  TABLET_POSITION[0] + OFFSET * Math.cos(TABLET_TURN),
  DESK_TOP_Y + RADIUS,
  TABLET_POSITION[2] - OFFSET * Math.sin(TABLET_TURN),
] as const;

/**
 * Rolled so the flat faces up, tipped towards the camera's side of the desk — the plane's normal
 * is square to the barrel, so up and sideways is as far as a roll can turn it. Resting *on* the
 * flat is what a pencil like this does on a real desk, and it is the wrong pose here: it hides
 * the one feature that makes the object an Apple Pencil, and what is left from across the desk
 * is a dowel. This is the same pencil a few degrees into the roll it never quite finishes.
 */
const ROLL = Math.PI / 2 - 0.42;

export function Pencil(): ReactElement {
  const parts = useDisposable(() => ({ body: createPencilBody(), nib: createPencilNib() }));

  return (
    <group position={PENCIL_POSITION}>
      {/* The roll runs innermost so it turns the barrel about its own axis, and the meshes
          carry the half-length that centers the group on the middle of the pencil rather than
          on its tail. */}
      <group rotation={[0, TABLET_TURN, ROLL]}>
        <mesh geometry={parts.body} position={[0, 0, -LENGTH / 2]}>
          <meshStandardMaterial {...PENCIL_BODY} />
        </mesh>
        <mesh geometry={parts.nib} position={[0, 0, -LENGTH / 2]}>
          <meshStandardMaterial {...PENCIL_NIB} />
        </mesh>
      </group>
      <ContactShadows
        position={[0, -RADIUS + 0.0006, 0]}
        scale={0.24}
        resolution={256}
        blur={1.2}
        far={0.02}
        opacity={0.4}
        color="#01050a"
        frames={1}
      />
    </group>
  );
}

/** The modeled pencil, for the spec that holds the shape to the device it is measured from. */
export const PENCIL = {
  length: LENGTH,
  radius: RADIUS,
  flatWidth: FLAT_WIDTH,
  flatOffset: FLAT_OFFSET,
  taperAt: TAPER_AT,
  nibAt: NIB_AT,
  nibTip: NIB_TIP,
  segments: SEGMENTS,
} as const;

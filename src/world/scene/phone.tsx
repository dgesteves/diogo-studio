"use client";

import { type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";
import { ExtrudeGeometry, Shape, ShapeGeometry, Vector2, type BufferGeometry } from "three";
import { stationIndex } from "@/content/pages";
import { useDisposable } from "../gpu";
import { DESK_TOP_Y } from "../room";
import { PHONE_SCREEN, usePhoneScreenTexture, type PhoneApp } from "../screens/phone";
import { getStation } from "../stations";

/**
 * The phone lying face-up beside the mouse, screen on.
 *
 * What makes one recognizable at this size is not the proportions — a 16 cm rectangle is a
 * rectangle — but **the corner**. It is not a circular arc: the curvature runs on into the
 * straight edge instead of meeting it at a step, which is why a rounded rectangle of the
 * right radius still reads as a remote control. So the outline is a superellipse corner,
 * sampled once and used three times, and the body is that profile extruded rather than a
 * `RoundedBox` — one radius on twelve edges would round the flat sides too and leave a bar
 * of soap where a flat-sided phone should be.
 *
 * Three concentric copies of the one outline are the whole object: the aluminum body, the
 * glass inside its rim, and the display inside the bezel. Offsetting a profile keeps the
 * corners concentric, which is what makes the display's corner look like it belongs to the
 * body's — the single thing a phone gets wrong when its screen is a plain rectangle laid on
 * top.
 *
 * Two things on the real device are deliberately not here. The camera plateau is on the back
 * and the back is against the desk, so modeling it would be geometry nothing can ever see.
 * The side buttons are 0.4 mm of relief on a wall 8.75 mm tall seen almost edge-on from
 * anywhere in this room — under a pixel, and a texture to say nothing. See `mouse.tsx`,
 * which leaves its cable and its grip texture off for the same reason.
 */

/** In meters, off the real device: 163.4 × 78 × 8.75 mm, with a 12.5 mm corner. */
export const PHONE = {
  width: 0.078,
  length: 0.1634,
  thickness: 0.00875,
  cornerRadius: 0.0125,
} as const;

/**
 * The rim of frame that shows around the glass from above, and the black border between the
 * glass edge and the first lit pixel. Together they are the 2.55 mm the real device insets
 * its display by, which is also what sets the display's aspect — see `PHONE_SCREEN`.
 */
const RIM = 0.0009;
const BEZEL = 0.00165;
const GLASS_INSET = RIM;
const DISPLAY_INSET = RIM + BEZEL;

/** The chamfer at the top and bottom of the frame band. A phone's sides are flat, not round. */
const EDGE_FILLET = 0.0006;

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
export function phoneOutline(inset = 0): Vector2[] {
  const halfWidth = PHONE.width / 2 - inset;
  const halfLength = PHONE.length / 2 - inset;
  const radius = Math.max(0.0005, PHONE.cornerRadius - inset);
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

function phoneProfile(inset = 0): Shape {
  return new Shape().setFromPoints(phoneOutline(inset));
}

/**
 * The body. `ExtrudeGeometry` grows its section outward by the bevel and runs from
 * `-bevelThickness`, so the profile is drawn one chamfer small and the mesh is lifted by one
 * — fed the finished outline instead, a phone comes out a millimeter wide and sunk into the
 * desk. `scene/mac-studio.tsx` documents the same two traps at length.
 */
export const BODY_LIFT = EDGE_FILLET;

export function createBodyGeometry(): BufferGeometry {
  return new ExtrudeGeometry(phoneProfile(EDGE_FILLET), {
    depth: PHONE.thickness - EDGE_FILLET * 2,
    bevelEnabled: true,
    bevelSize: EDGE_FILLET,
    bevelThickness: EDGE_FILLET,
    bevelSegments: 3,
  });
}

/**
 * The display, and the one thing `ShapeGeometry` will not do for a textured face: its UVs
 * are the vertex coordinates themselves, which here are meters, so the home screen would
 * tile a hundred times inside a 7 cm panel. They are rewritten to the panel's own box.
 */
export function createDisplayGeometry(): BufferGeometry {
  const geometry = new ShapeGeometry(phoneProfile(DISPLAY_INSET));
  const position = geometry.getAttribute("position");
  const width = PHONE.width - DISPLAY_INSET * 2;
  const length = PHONE.length - DISPLAY_INSET * 2;
  const uv = geometry.getAttribute("uv");

  for (let index = 0; index < position.count; index += 1) {
    uv.setXY(index, position.getX(index) / width + 0.5, position.getY(index) / length + 0.5);
  }
  uv.needsUpdate = true;

  return geometry;
}

/**
 * Silver, and metal rather than metallic: nothing in this room supplies an environment map,
 * and a `meshStandardMaterial` at high metalness has only reflections to be lit by — turned
 * up to what a polished frame "should" be, this phone rendered charcoal under bright light,
 * which is a black phone. So the albedo carries the silver and the metalness is kept low
 * enough that the direct lights still reach it. `scene/mac-studio.tsx` lands on the same
 * split from the other side: it is the largest flat face on the desk and had to be darkened
 * to stop it blooming, where this is a 0.9 mm rim and an 8.75 mm wall and can stay bright.
 */
const FRAME = { color: "#c2c8ce", roughness: 0.42, metalness: 0.38 } as const;
/**
 * Cover glass: nearly black, and satin rather than polished — as is the frame above it, which
 * is duller here than a machined frame really is. At a mirror roughness both of them caught
 * the key light as a single hot point and the bloom pass turned it into a flare. This is 8 cm
 * of glass and curved metal under a rig lit for a room, and a specular spike is what that rig
 * does with a polished one.
 */
const GLASS = { color: "#05080c", roughness: 0.42, metalness: 0.3 } as const;

/**
 * The apps, bound here rather than in the draw: the stations are the authored record and
 * their accents are the room's own tuning, so this is where the two meet. Module scope keeps
 * the array's identity stable — `usePhoneScreenTexture` has it as an effect dependency, and
 * a fresh array per render would repaint and re-upload the texture on every frame.
 */
const APPS: readonly PhoneApp[] = stationIndex.map(({ slug, label }) => ({
  label,
  accent: getStation(slug).accent,
}));

const SCREEN_Y = PHONE.thickness;
/**
 * The two panels over the body's top face. The steps between them are tenths of a millimeter
 * — nothing at the scale of a bezel 1.65 mm wide — but they are not hairlines on purpose: the
 * room's camera runs a 0.1–60 m frustum, and on a depth buffer that shallow the glass punches
 * through the display in patches from across the desk.
 */
const GLASS_Y = SCREEN_Y + 0.00015;
const DISPLAY_Y = SCREEN_Y + 0.0005;
const DISPLAY_WIDTH = PHONE.width - DISPLAY_INSET * 2;
const DISPLAY_LENGTH = PHONE.length - DISPLAY_INSET * 2;

/**
 * Right of the mouse, which ends at x ≈ 0.61, and along the front of the desk rather than in
 * the row the mug and the headphones stand in — everything on that side of the desk sits
 * behind z ≈ 0.15, so this strip is clear all the way to the edge. Turned slightly, the way
 * a phone that was put down is.
 */
const PHONE_POSITION = [0.88, DESK_TOP_Y, 0.4] as const;
const PHONE_TURN = 0.11;

/** Laid flat: the profile is drawn in the shape's plane and turned a quarter to face up. */
const FACE_UP = [-Math.PI / 2, 0, 0] as const;

export function Phone(): ReactElement {
  const screen = usePhoneScreenTexture(APPS);
  const parts = useDisposable(() => ({
    body: createBodyGeometry(),
    glass: new ShapeGeometry(phoneProfile(GLASS_INSET)),
    display: createDisplayGeometry(),
  }));

  return (
    <group position={PHONE_POSITION} rotation={[0, PHONE_TURN, 0]}>
      <mesh geometry={parts.body} position={[0, BODY_LIFT, 0]} rotation={FACE_UP}>
        <meshStandardMaterial {...FRAME} />
      </mesh>
      <mesh geometry={parts.glass} position={[0, GLASS_Y, 0]} rotation={FACE_UP}>
        <meshStandardMaterial {...GLASS} />
      </mesh>
      {/*
        Unlit, like the coaster's print and unlike the monitors: a `meshStandardMaterial`
        adds the room's light to the panel *on top of* what it emits, so every colored
        hotspot that sweeps the desk washed a warm copy of the home screen over the real one
        and the whole phone flared. A screen emits; it does not also catch the light. Painted
        pixels, untone-mapped, is exactly that — and it is the same brightness from every
        angle and at every station, which is what stops it flashing.
      */}
      <mesh geometry={parts.display} position={[0, DISPLAY_Y, 0]} rotation={FACE_UP}>
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <ContactShadows
        position={[0, 0.0007, 0]}
        scale={0.34}
        resolution={256}
        blur={1.6}
        far={0.05}
        opacity={0.55}
        color="#01050a"
        frames={1}
      />
    </group>
  );
}

/** The modeled display, for the spec that holds the canvas to the panel it is painted on. */
export const DISPLAY = {
  width: DISPLAY_WIDTH,
  length: DISPLAY_LENGTH,
  aspect: DISPLAY_LENGTH / DISPLAY_WIDTH,
  canvasAspect: PHONE_SCREEN.height / PHONE_SCREEN.width,
} as const;

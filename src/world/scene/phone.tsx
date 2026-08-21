"use client";

import { type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";
import { stationIndex } from "@/content/pages";
import { useDisposable } from "../gpu";
import { DESK_TOP_Y } from "../room";
import { type HomeApp } from "../screens/home";
import { PHONE_SCREEN, usePhoneScreenTexture } from "../screens/phone";
import { getStation } from "../stations";
import {
  createSlabBody,
  createSlabFace,
  FACE_UP,
  SLAB_FRAME,
  SLAB_GLASS,
  type SlabSpec,
} from "./slab";

/**
 * The phone lying face-up beside the mouse, screen on. It is a glass slab, so its shape comes
 * from `slab.ts` — this file is the phone's measurements, its place on the desk and what it
 * shows.
 *
 * Two things on the real device are deliberately not here. The camera plateau is on the back
 * and the back is against the desk, so modeling it would be geometry nothing can ever see.
 * The side buttons are 0.4 mm of relief on a wall 8.75 mm tall seen almost edge-on from
 * anywhere in this room — under a pixel, and a texture to say nothing. See `mouse.tsx`,
 * which leaves its cable and its grip texture off for the same reason.
 */

/** In meters, off the real device: 163.4 × 78 × 8.75 mm, with a 12.5 mm corner. */
export const PHONE: SlabSpec = {
  width: 0.078,
  length: 0.1634,
  thickness: 0.00875,
  cornerRadius: 0.0125,
  fillet: 0.0006,
};

/**
 * The rim of frame that shows around the glass from above, and the black border between the
 * glass edge and the first lit pixel. Together they are the 2.55 mm the real device insets
 * its display by, which is also what sets the display's aspect — see `PHONE_SCREEN`.
 */
const RIM = 0.0009;
const BEZEL = 0.00165;
const GLASS_INSET = RIM;
const DISPLAY_INSET = RIM + BEZEL;

/**
 * The apps, bound here rather than in the draw: the stations are the authored record and
 * their accents are the room's own tuning, so this is where the two meet. Module scope keeps
 * the array's identity stable — `usePhoneScreenTexture` has it as an effect dependency, and
 * a fresh array per render would repaint and re-upload the texture on every frame.
 */
const APPS: readonly HomeApp[] = stationIndex.map(({ slug, label }) => ({
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

export function Phone(): ReactElement {
  const screen = usePhoneScreenTexture(APPS);
  const parts = useDisposable(() => ({
    body: createSlabBody(PHONE),
    glass: createSlabFace(PHONE, GLASS_INSET),
    display: createSlabFace(PHONE, DISPLAY_INSET),
  }));

  return (
    <group position={PHONE_POSITION} rotation={[0, PHONE_TURN, 0]}>
      <mesh geometry={parts.body} position={[0, PHONE.fillet, 0]} rotation={FACE_UP}>
        <meshStandardMaterial {...SLAB_FRAME} />
      </mesh>
      <mesh geometry={parts.glass} position={[0, GLASS_Y, 0]} rotation={FACE_UP}>
        <meshStandardMaterial {...SLAB_GLASS} />
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

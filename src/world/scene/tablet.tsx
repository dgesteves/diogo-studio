"use client";

import { type ReactElement } from "react";
import { ContactShadows } from "@react-three/drei";
import { stationIndex } from "@/content/pages";
import { useDisposable } from "../gpu";
import { DESK_TOP_Y } from "../room";
import { type HomeApp } from "../screens/home";
import { TABLET_SCREEN, useTabletScreenTexture } from "../screens/tablet";
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
 * The tablet lying face-up to the left of the keyboard, screen on. It is the phone's larger
 * relation and is built the same way — the squircle profile, the body extruded from it, and
 * the glass and the display as two concentric copies of the one outline — so the shape lives
 * in `slab.ts` and this file is the measurements, the place on the desk and what it shows.
 *
 * Silver, which on this object is the whole point and the thing that took tuning: a tablet is
 * mostly frame seen from above, so where the phone can be read by its screen alone this one
 * is read by the band of aluminum around it. See `SLAB_FRAME` for why that band is not a
 * polished metal.
 *
 * Nothing is modeled on the back — the camera bar, the connector, the etching are all against
 * the desk — and nothing on the walls: they are 5.3 mm tall, seen from meters away, and a
 * button on them would be a tenth of a pixel.
 */

/** In meters, off the real device — an 11-inch iPad Pro: 249.7 × 177.5 × 5.3 mm, with an
 *  18 mm corner. */
export const TABLET: SlabSpec = {
  width: 0.1775,
  length: 0.2497,
  thickness: 0.0053,
  cornerRadius: 0.018,
  fillet: 0.0005,
};

/**
 * The rim of frame that shows around the glass from above, and the black border between the
 * glass edge and the first lit pixel. Together they are the 8.45 mm this device insets its
 * display by — a border five times the phone's, and one of the two things that keep a tablet
 * from reading as a phone at this size. (The other is the corner, which is proportionally
 * tighter here: 18 mm on a 177 mm side, against 12.5 on 78.)
 */
const RIM = 0.0012;
const BEZEL = 0.00725;
const GLASS_INSET = RIM;
const DISPLAY_INSET = RIM + BEZEL;

/**
 * The apps, bound here rather than in the draw: the stations are the authored record and
 * their accents are the room's own tuning, so this is where the two meet. Module scope keeps
 * the array's identity stable — `useTabletScreenTexture` has it as an effect dependency, and
 * a fresh array per render would repaint and re-upload the texture on every frame.
 */
const APPS: readonly HomeApp[] = stationIndex.map(({ slug, label }) => ({
  label,
  accent: getStation(slug).accent,
}));

const SCREEN_Y = TABLET.thickness;
/**
 * The two panels over the body's top face, at the same steps the phone uses: tenths of a
 * millimeter, and deliberately not hairlines — the room's camera runs a 0.1–60 m frustum, and
 * on a depth buffer that shallow the glass punches through the display from across the desk.
 */
const GLASS_Y = SCREEN_Y + 0.00015;
const DISPLAY_Y = SCREEN_Y + 0.0005;
const DISPLAY_WIDTH = TABLET.width - DISPLAY_INSET * 2;
const DISPLAY_LENGTH = TABLET.length - DISPLAY_INSET * 2;

/**
 * Left of the keyboard, which starts at x ≈ -0.4, and set back from the front edge: this is
 * the corner of the desk the drawing tablet used to hold, and it is the one clear patch of
 * surface big enough for a 25 cm object. Turned slightly, the way something put down beside
 * the thing you are actually using is.
 */
const TABLET_POSITION = [-0.62, DESK_TOP_Y, -0.04] as const;
const TABLET_TURN = 0.12;

export function Tablet(): ReactElement {
  const screen = useTabletScreenTexture(APPS);
  const parts = useDisposable(() => ({
    body: createSlabBody(TABLET),
    glass: createSlabFace(TABLET, GLASS_INSET),
    display: createSlabFace(TABLET, DISPLAY_INSET),
  }));

  return (
    <group position={TABLET_POSITION} rotation={[0, TABLET_TURN, 0]}>
      <mesh geometry={parts.body} position={[0, TABLET.fillet, 0]} rotation={FACE_UP}>
        <meshStandardMaterial {...SLAB_FRAME} />
      </mesh>
      <mesh geometry={parts.glass} position={[0, GLASS_Y, 0]} rotation={FACE_UP}>
        <meshStandardMaterial {...SLAB_GLASS} />
      </mesh>
      {/* Unlit, like the phone's: a lit material adds the room's light to what the panel
          emits, so every colored hotspot sweeping the desk washes a second copy of the home
          screen over the real one. A screen emits; it does not also catch the light. */}
      <mesh geometry={parts.display} position={[0, DISPLAY_Y, 0]} rotation={FACE_UP}>
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <ContactShadows
        position={[0, 0.0007, 0]}
        scale={0.44}
        resolution={256}
        blur={1.6}
        far={0.05}
        opacity={0.5}
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
  canvasAspect: TABLET_SCREEN.height / TABLET_SCREEN.width,
} as const;

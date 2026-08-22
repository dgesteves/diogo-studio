"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { DoubleSide } from "three";
import { anodizedMetalMaterial, worldColors, darkMetalMaterial } from "../materials";
import { DESK_DEPTH, DESK_LEG_HEIGHT, DESK_TOP_THICKNESS, DESK_TOP_Y } from "../room";
import { type Vec3 } from "../stations";
import { useDisposable } from "../gpu";
import { createSledLoop, type SledSpec } from "./sled";
import { Keyboard } from "./keyboard";
import { CoffeeMug } from "./mug";
import { Mouse } from "./mouse";
import { Pencil } from "./pencil";
import { Aloe } from "./plant";
import { Phone } from "./phone";
import { Tablet } from "./tablet";

/**
 * The desk and everything resting on it that is not hardware — the aloe, lamp, headphones — plus the
 * composition that places the input devices and the printed mug from their own files. The desk
 * surface height lives in `world/room.ts`, because the camera framing derives from it too.
 */

const DESK_WIDTH = 3;

/**
 * The desk stands on the same bent bar as the lounge table — `sled.ts` carries why, and the
 * four posts this replaced are the reason. At three meters it is the widest thing in the room
 * and the one a visitor sits at, so what is under it is a floor a chair rolls across rather
 * than a row of shins: two loops, and nothing between them.
 *
 * Scaled from the table's rather than copied: a 2 cm section on a 92 cm runner, standing 35 cm
 * in from each end. The cantilever is proportionally shorter than the table's because the span
 * between the loops is twice as long, and a 3 m top hung off its middle reads as a plank.
 */
const SLED: SledSpec = {
  width: 0.08,
  thickness: 0.02,
  halfRun: 0.46,
  bend: 0.1,
  rise: DESK_LEG_HEIGHT - DESK_TOP_THICKNESS / 2,
};

const SLED_INSET = 0.35;
/** A quarter turn, which lays each bar's run across the desk's depth. The pair stays parallel:
 *  the lounge table crosses its two into an X, and the desk is the piece that does not. */
const SLED_TURN = Math.PI / 2;
const LOOP_XS = [-1, 1].map((side) => side * (DESK_WIDTH / 2 - SLED_INSET));

export function Desk(): ReactElement {
  const loop = useDisposable(() => createSledLoop(SLED));

  return (
    <group position={[0, DESK_LEG_HEIGHT, 0]}>
      <RoundedBox args={[DESK_WIDTH, DESK_TOP_THICKNESS, DESK_DEPTH]} radius={0.02} smoothness={2}>
        <meshStandardMaterial color="#0d1216" roughness={0.55} metalness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.005, DESK_DEPTH / 2 + 0.005]}>
        <boxGeometry args={[2.8, 0.006, 0.006]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      {/* The loops are drawn from the floor up, so they hang below the group the top sets. */}
      {LOOP_XS.map((x) => (
        <mesh
          key={x}
          geometry={loop}
          position={[x, -DESK_LEG_HEIGHT, 0]}
          rotation={[0, SLED_TURN, 0]}
          castShadow
        >
          <meshStandardMaterial {...anodizedMetalMaterial} />
        </mesh>
      ))}
    </group>
  );
}

/** Far enough left to be behind the keyboard's shoulder rather than in front of a monitor. */
const DESK_PLANT: Vec3 = [-0.95, DESK_TOP_Y, 0.3];

const EARCUP_SIDES = [-1, 1] as const;
const EARCUP_X = 0.108;
const EARCUP_RADIUS = 0.058;
const EARCUP_HALF_DEPTH = 0.017;
const EARPAD_TUBE = 0.016;
const HEADBAND_Y = 0.215;
const HEADBAND_RADIUS = 0.14;
const HEADBAND_TUBE = 0.016;
const EARCUP_Y = HEADBAND_Y - EARCUP_RADIUS - 0.004;
const BASE_TOP = 0.018;
const BASE_TOP_RADIUS = 0.088;
const BASE_BOTTOM_RADIUS = 0.098;
/**
 * The stand's accent is a slot let into the plinth's flank, at half its height so the tube sits
 * flush in the taper. It used to be a torus lying in the plinth's *top* face, a hair above it:
 * a horizontal neon circle on a horizontal plate, which at desk height is indistinguishable
 * from a ring painted on the desk. An accent goes on an edge you can see the thickness of.
 */
const BASE_BAND_RADIUS = (BASE_TOP_RADIUS + BASE_BOTTOM_RADIUS) / 2;
const BASE_BAND_TUBE = 0.0022;
const POST_TOP = HEADBAND_Y + HEADBAND_RADIUS - HEADBAND_TUBE;
const YOKE_X = HEADBAND_RADIUS - EARCUP_X;
const YOKE_HEIGHT = HEADBAND_Y - EARCUP_Y + 0.012;
const SHELL_MATERIAL = { color: "#0c1116", roughness: 0.55, metalness: 0.45 } as const;

function Headphones(): ReactElement {
  return (
    <group position={[1.12, DESK_TOP_Y, 0.05]}>
      <mesh position={[0, BASE_TOP / 2, 0]}>
        <cylinderGeometry args={[BASE_TOP_RADIUS, BASE_BOTTOM_RADIUS, BASE_TOP, 24]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
      <mesh position={[0, BASE_TOP / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BASE_BAND_RADIUS, BASE_BAND_TUBE, 8, 40]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, (BASE_TOP + POST_TOP) / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.018, POST_TOP - BASE_TOP, 14]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
      <mesh position={[0, HEADBAND_Y, 0]}>
        <torusGeometry args={[HEADBAND_RADIUS, HEADBAND_TUBE, 12, 40, Math.PI]} />
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </mesh>
      {EARCUP_SIDES.map((side) => (
        <Earcup key={side} side={side} />
      ))}
      {/*
        No accent lamp in front of the cups. An accent `pointLight` a few centimeters over the
        desk paints a lit disc on three meters of matte top, and with nothing above the disc
        that could have thrown it — this one stood 20 cm *forward* of the stand, over bare desk
        — the disc reads as a circle on the table rather than as spill. The earcup rings are
        the accent; Bloom carries them.
      */}
    </group>
  );
}

function Earcup({ side }: { side: number }): ReactElement {
  return (
    <group position={[side * EARCUP_X, EARCUP_Y, 0]}>
      <RoundedBox
        args={[0.007, YOKE_HEIGHT, 0.02]}
        radius={0.003}
        smoothness={2}
        position={[side * YOKE_X, (HEADBAND_Y - EARCUP_Y) / 2, 0]}
      >
        <meshStandardMaterial {...darkMetalMaterial} />
      </RoundedBox>
      <mesh position={[side * YOKE_X * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.007, YOKE_X, 10]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[EARCUP_RADIUS, EARCUP_RADIUS, EARCUP_HALF_DEPTH * 2, 28]} />
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </mesh>
      <mesh position={[side * (EARCUP_HALF_DEPTH + 0.0045), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.038, 0.046, 0.009, 24]} />
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </mesh>
      <mesh
        position={[-side * (EARCUP_HALF_DEPTH + EARPAD_TUBE * 0.55), 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <torusGeometry args={[EARCUP_RADIUS - EARPAD_TUBE, EARPAD_TUBE, 12, 32]} />
        <meshStandardMaterial color="#05080b" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[side * (EARCUP_HALF_DEPTH + 0.001), 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[EARCUP_RADIUS - 0.006, 0.003, 10, 32]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function DeskExtras(): ReactElement {
  return (
    <group>
      <DeskLamp />
      <Headphones />
    </group>
  );
}

function DeskLamp(): ReactElement {
  return (
    <group position={[-1.36, DESK_TOP_Y, 0.3]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.016, 24]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.54, 12]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
      <mesh position={[0, 0.55, 0.2]} rotation={[Math.PI / 2.6, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.48, 12]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
      <group position={[0, 0.625, 0.415]} rotation={[-0.5, 0, 0]}>
        <mesh position={[0, 0.062, 0]}>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshStandardMaterial {...darkMetalMaterial} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.034, 0.078, 0.12, 24, 1, true]} />
          <meshStandardMaterial {...darkMetalMaterial} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.034, 24]} />
          <meshStandardMaterial {...darkMetalMaterial} />
        </mesh>
        <mesh position={[0, -0.056, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.076, 24]} />
          <meshBasicMaterial color={worldColors.coolLight} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.026, 0]}>
          <sphereGeometry args={[0.019, 12, 12]} />
          <meshBasicMaterial color={worldColors.coolLightCore} toneMapped={false} />
        </mesh>
        <pointLight
          position={[0, -0.1, 0]}
          intensity={0.9}
          distance={1.8}
          decay={2}
          color={worldColors.coolLight}
        />
      </group>
    </group>
  );
}

export function DeskProps(): ReactElement {
  return (
    <group>
      <Keyboard />
      <Mouse />
      <Phone />
      <CoffeeMug />
      <Aloe position={DESK_PLANT} />
      <Tablet />
      <Pencil />
    </group>
  );
}

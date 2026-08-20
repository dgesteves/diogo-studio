"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { DoubleSide } from "three";
import { worldColors, darkMetalMaterial } from "../materials";
import { DESK_LEG_HEIGHT, DESK_TOP_THICKNESS, DESK_TOP_Y } from "../room";
import { Keyboard } from "./keyboard";
import { CoffeeMug } from "./mug";
import { Mouse } from "./mouse";
import { Phone } from "./phone";
import { GraphicsTablet } from "./tablet";

/**
 * The desk and everything resting on it that is not hardware — plant, lamp, headphones — plus the
 * composition that places the input devices and the printed mug from their own files. The desk
 * surface height lives in `world/room.ts`, because the camera framing derives from it too.
 */

const LEG_POSITIONS = [
  [-1.35, -0.45],
  [1.35, -0.45],
  [-1.35, 0.45],
  [1.35, 0.45],
] as const;

export function Desk(): ReactElement {
  return (
    <group position={[0, DESK_LEG_HEIGHT, 0]}>
      <RoundedBox args={[3.0, DESK_TOP_THICKNESS, 1.1]} radius={0.02} smoothness={2}>
        <meshStandardMaterial color="#0d1216" roughness={0.55} metalness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.005, 0.555]}>
        <boxGeometry args={[2.8, 0.006, 0.006]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      {LEG_POSITIONS.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, -DESK_LEG_HEIGHT / 2, z]}>
          <cylinderGeometry args={[0.028, 0.028, DESK_LEG_HEIGHT, 10]} />
          <meshStandardMaterial color="#13181d" roughness={0.65} metalness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function PlantPot(): ReactElement {
  return (
    <group position={[-0.95, DESK_TOP_Y, 0.3]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.055, 0.045, 0.1, 20]} />
        <meshStandardMaterial color="#2a1c11" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.055, 0.005, 8, 20]} />
        <meshStandardMaterial color="#3a261a" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.097, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.005, 20]} />
        <meshStandardMaterial color="#0c0805" roughness={1} metalness={0} />
      </mesh>
      {FOLIAGE_CLUMPS.map((clump) => (
        <mesh key={clump.position.join(",")} position={clump.position}>
          <icosahedronGeometry args={[clump.radius, 0]} />
          <meshStandardMaterial color={clump.color} roughness={0.6} flatShading />
        </mesh>
      ))}
    </group>
  );
}

type FoliageClump = {
  position: [number, number, number];
  radius: number;
  color: string;
};

const FOLIAGE_CLUMPS: FoliageClump[] = [
  { position: [0, 0.155, 0], radius: 0.058, color: "#1f4a32" },
  { position: [-0.045, 0.168, 0.014], radius: 0.05, color: "#266a44" },
  { position: [0.046, 0.16, -0.014], radius: 0.048, color: "#1a4028" },
  { position: [0.006, 0.166, 0.046], radius: 0.044, color: "#2b6e48" },
  { position: [-0.008, 0.178, -0.044], radius: 0.044, color: "#22573a" },
  { position: [0, 0.198, 0.004], radius: 0.04, color: "#266a44" },
];

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
const POST_TOP = HEADBAND_Y + HEADBAND_RADIUS - HEADBAND_TUBE;
const YOKE_X = HEADBAND_RADIUS - EARCUP_X;
const YOKE_HEIGHT = HEADBAND_Y - EARCUP_Y + 0.012;
const SHELL_MATERIAL = { color: "#0c1116", roughness: 0.55, metalness: 0.45 } as const;

function Headphones(): ReactElement {
  return (
    <group position={[1.12, DESK_TOP_Y, 0.05]}>
      <mesh position={[0, 0.009, 0]}>
        <cylinderGeometry args={[0.088, 0.098, 0.018, 24]} />
        <meshStandardMaterial {...darkMetalMaterial} />
      </mesh>
      <mesh position={[0, 0.019, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.072, 0.0024, 10, 32]} />
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
      <pointLight
        position={[0, EARCUP_Y, 0.2]}
        intensity={0.12}
        distance={0.6}
        decay={2}
        color={worldColors.accent}
      />
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
      <PlantPot />
      <GraphicsTablet />
    </group>
  );
}

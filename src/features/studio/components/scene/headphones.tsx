"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { DESK_TOP_Y, METAL } from "./constants";

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

export function Headphones(): ReactElement {
  return (
    <group position={[1.12, DESK_TOP_Y, 0.05]}>
      <mesh position={[0, 0.009, 0]}>
        <cylinderGeometry args={[0.088, 0.098, 0.018, 24]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.019, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.072, 0.0024, 10, 32]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, (BASE_TOP + POST_TOP) / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.018, POST_TOP - BASE_TOP, 14]} />
        <meshStandardMaterial {...METAL} />
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
        color={brandColors.accent}
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
        <meshStandardMaterial {...METAL} />
      </RoundedBox>
      <mesh position={[side * YOKE_X * 0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.007, YOKE_X, 10]} />
        <meshStandardMaterial {...METAL} />
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
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

"use client";

import { type ReactElement } from "react";
import { worldColors } from "@/world/materials";

const BARREL_LENGTH = 0.126;
const BARREL_HALF = BARREL_LENGTH / 2;
const BARREL_TAIL_RADIUS = 0.0055;
const BARREL_TIP_RADIUS = 0.0042;
const GRIP_LENGTH = 0.036;
const TIP_LENGTH = 0.02;

export const STYLUS_RADIUS = 0.0062;

type StylusProps = {
  position: [number, number, number];
  rotation: [number, number, number];
};

export function Stylus({ position, rotation }: StylusProps): ReactElement {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[BARREL_TAIL_RADIUS, BARREL_TIP_RADIUS, BARREL_LENGTH, 14]} />
        <meshStandardMaterial color="#161c22" roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh position={[0, -BARREL_HALF + GRIP_LENGTH / 2, 0]}>
        <cylinderGeometry args={[STYLUS_RADIUS, 0.0052, GRIP_LENGTH, 14]} />
        <meshStandardMaterial color="#0b1015" roughness={0.88} metalness={0.12} />
      </mesh>
      <mesh position={[0, -BARREL_HALF - TIP_LENGTH / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[BARREL_TIP_RADIUS, TIP_LENGTH, 14]} />
        <meshStandardMaterial color="#0d1216" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, BARREL_HALF, 0]}>
        <sphereGeometry args={[BARREL_TAIL_RADIUS, 14, 10]} />
        <meshStandardMaterial color="#1a2530" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, -BARREL_HALF + GRIP_LENGTH + 0.003, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.0055, 0.0011, 8, 20]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0.0048, 0.014, 0]}>
        <capsuleGeometry args={[0.0015, 0.013, 4, 10]} />
        <meshStandardMaterial color="#22303a" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

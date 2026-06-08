"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";

const BASE_Y = 0.04;
const SEAT_Y = 0.46;
const SEAT_THICKNESS = 0.07;
const POLE_HEIGHT = SEAT_Y - SEAT_THICKNESS / 2 - BASE_Y;
const BACKREST_HEIGHT = 0.66;

export function Chair(): ReactElement {
  return (
    <group position={[0, 0, 0.95]}>
      <mesh position={[0, BASE_Y, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.028, 24]} />
        <meshStandardMaterial color="#13181d" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, BASE_Y + POLE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.028, 0.028, POLE_HEIGHT, 12]} />
        <meshStandardMaterial color="#1c242b" roughness={0.5} metalness={0.5} />
      </mesh>
      <RoundedBox
        args={[0.54, SEAT_THICKNESS, 0.5]}
        radius={0.03}
        smoothness={2}
        position={[0, SEAT_Y, 0]}
      >
        <meshStandardMaterial color="#0e1418" roughness={0.65} metalness={0.2} />
      </RoundedBox>
      <RoundedBox
        args={[0.52, BACKREST_HEIGHT, 0.07]}
        radius={0.05}
        smoothness={2}
        position={[0, SEAT_Y + SEAT_THICKNESS / 2 + BACKREST_HEIGHT / 2, 0.24]}
      >
        <meshStandardMaterial color="#0e1418" roughness={0.65} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}

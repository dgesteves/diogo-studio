"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { DESK_LEG_HEIGHT, DESK_TOP_THICKNESS } from "./constants";

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
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
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

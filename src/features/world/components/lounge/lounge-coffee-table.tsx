"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { FRAME, TABLE_Z, WOOD } from "./constants";

const TOP_Y = 0.34;
const LEG_X = 0.5;
const LEG_Z = 0.28;

export function LoungeCoffeeTable(): ReactElement {
  return (
    <group position={[0, 0, TABLE_Z]}>
      <RoundedBox
        args={[1.3, 0.06, 0.7]}
        radius={0.02}
        smoothness={3}
        position={[0, TOP_Y, 0]}
        castShadow
      >
        <meshStandardMaterial {...WOOD} />
      </RoundedBox>

      <mesh position={[0, TOP_Y + 0.032, 0]}>
        <boxGeometry args={[1.0, 0.004, 0.5]} />
        <meshBasicMaterial
          color={brandColors.accent}
          toneMapped={false}
          transparent
          opacity={0.35}
        />
      </mesh>

      {[-LEG_X, LEG_X].map((x) =>
        [-LEG_Z, LEG_Z].map((z) => (
          <mesh key={`${x},${z}`} position={[x, TOP_Y / 2 - 0.02, z]}>
            <cylinderGeometry args={[0.022, 0.022, TOP_Y - 0.06, 10]} />
            <meshStandardMaterial {...FRAME} />
          </mesh>
        )),
      )}

      <mesh position={[0.34, TOP_Y + 0.06, 0.06]}>
        <boxGeometry args={[0.22, 0.07, 0.3]} />
        <meshStandardMaterial color="#101820" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0.34, TOP_Y + 0.1, 0.06]} rotation={[0.18, 0.3, 0]}>
        <boxGeometry args={[0.2, 0.012, 0.28]} />
        <meshStandardMaterial color="#16222c" roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

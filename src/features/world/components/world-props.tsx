"use client";

import { type ReactElement } from "react";
import { brandColors } from "@/config/brand";

import { Bookshelf } from "./props/bookshelf";
import { WallScreens } from "./props/wall-screens";

export function WorldProps(): ReactElement {
  return (
    <group>
      <Bookshelf />

      <group position={[-1.8, 0, 1.4]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.16, 0.12, 0.36, 16]} />
          <meshStandardMaterial color="#11181f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <icosahedronGeometry args={[0.32, 1]} />
          <meshStandardMaterial color="#1f3a2c" roughness={0.9} flatShading />
        </mesh>
      </group>

      <group position={[-2.27, 0, 2.4]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[0.9, 2.1, 0.06]} />
          <meshStandardMaterial color="#0b1116" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.05, 0.04]}>
          <boxGeometry args={[0.7, 1.9, 0.02]} />
          <meshBasicMaterial color={brandColors.ink} toneMapped={false} />
        </mesh>
      </group>

      <WallScreens />
    </group>
  );
}

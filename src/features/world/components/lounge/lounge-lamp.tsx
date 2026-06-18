"use client";

import { type ReactElement } from "react";
import { brandColors } from "@/config/brand";

import { FRAME } from "./constants";

const POLE_H = 1.5;

export function LoungeLamp(): ReactElement {
  return (
    <group position={[-1.4, 0, 0.2]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 20]} />
        <meshStandardMaterial {...FRAME} />
      </mesh>
      <mesh position={[0, POLE_H / 2, 0]}>
        <cylinderGeometry args={[0.018, 0.018, POLE_H, 12]} />
        <meshStandardMaterial {...FRAME} />
      </mesh>
      <mesh position={[0, POLE_H + 0.04, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.2, 20, 1, true]} />
        <meshStandardMaterial
          color="#1a2630"
          roughness={0.6}
          metalness={0.2}
          emissive={brandColors.accentSoft}
          emissiveIntensity={0.5}
          side={2}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[0, POLE_H, 0]}
        intensity={0.55}
        distance={2.6}
        decay={2}
        color={brandColors.accentSoft}
      />
    </group>
  );
}

"use client";

import { type ReactElement } from "react";

import { FRAME } from "./constants";

const POLE_H = 1.5;
const BULB = "#ffca7a";
const WARM_LIGHT = "#ffb774";

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
          color="#c79a5e"
          roughness={0.5}
          metalness={0.1}
          emissive={BULB}
          emissiveIntensity={1.1}
          side={2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, POLE_H - 0.05, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#ffe6b0" toneMapped={false} />
      </mesh>
      <pointLight
        position={[0, POLE_H - 0.08, 0]}
        intensity={1.5}
        distance={3.4}
        decay={2}
        color={WARM_LIGHT}
      />
    </group>
  );
}

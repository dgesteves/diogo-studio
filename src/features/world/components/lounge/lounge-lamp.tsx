"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { worldColors } from "@/world/materials";

import { FRAME } from "./constants";

const BLADE_H = 1.62;
const BLADE_W = 0.08;
const BLADE_D = 0.05;
const BLADE_Y = 0.08 + BLADE_H / 2;
const STRIP_H = BLADE_H - 0.14;
const STRIP_W = BLADE_W - 0.034;
const STRIP_ZS = [BLADE_D / 2 + 0.001, -BLADE_D / 2 - 0.001] as const;

export function LoungeLamp(): ReactElement {
  return (
    <group position={[1.5, 0, -1.05]} rotation={[0, -0.85, 0]}>
      <mesh position={[0, 0.016, 0]}>
        <cylinderGeometry args={[0.17, 0.19, 0.032, 28]} />
        <meshStandardMaterial {...FRAME} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.052, 0.072, 0.062, 20]} />
        <meshStandardMaterial {...FRAME} />
      </mesh>

      <RoundedBox
        args={[BLADE_W, BLADE_H, BLADE_D]}
        radius={0.022}
        smoothness={3}
        position={[0, BLADE_Y, 0]}
      >
        <meshStandardMaterial {...FRAME} />
      </RoundedBox>

      {STRIP_ZS.map((z) => (
        <mesh key={z} position={[0, BLADE_Y, z]}>
          <boxGeometry args={[STRIP_W, STRIP_H, 0.006]} />
          <meshBasicMaterial color={worldColors.coolLight} toneMapped={false} />
        </mesh>
      ))}

      <pointLight
        position={[0, BLADE_Y + 0.2, 0.14]}
        intensity={1.1}
        distance={3}
        decay={2}
        color={worldColors.coolLight}
      />
      <pointLight
        position={[0, 0.45, 0.14]}
        intensity={0.5}
        distance={2}
        decay={2}
        color={worldColors.coolLight}
      />
    </group>
  );
}

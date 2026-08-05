"use client";

import { useState, type ReactElement } from "react";
import { Object3D } from "three";
import { brandColors } from "@/config/brand";

const HOUSING = { color: "#10151b", roughness: 0.5, metalness: 0.6 } as const;
const BAR_POS: [number, number, number] = [0.12, 2.34, 0];
const TARGET_POS: [number, number, number] = [0.03, 0.7, 0];
const STRIP_X = 0.092;
const STRIP_YS = [0.48, 0.92, 1.36, 1.8, 2.26] as const;

export function ShelfLight(): ReactElement {
  const [target] = useState(() => new Object3D());

  return (
    <group>
      <mesh position={BAR_POS}>
        <boxGeometry args={[0.06, 0.028, 0.82]} />
        <meshStandardMaterial {...HOUSING} />
      </mesh>
      <mesh position={[BAR_POS[0], BAR_POS[1] - 0.018, BAR_POS[2]]}>
        <boxGeometry args={[0.04, 0.006, 0.78]} />
        <meshBasicMaterial color={brandColors.accentSoft} toneMapped={false} />
      </mesh>
      {STRIP_YS.map((y) => (
        <mesh key={y} position={[STRIP_X, y, 0]}>
          <boxGeometry args={[0.012, 0.006, 1.0]} />
          <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
        </mesh>
      ))}
      <primitive object={target} position={TARGET_POS} />
      <spotLight
        position={BAR_POS}
        target={target}
        angle={0.95}
        penumbra={0.85}
        intensity={3}
        distance={4}
        decay={2}
        color={brandColors.coolLight}
      />
      <pointLight
        position={[0.5, 1.15, 0]}
        intensity={1.1}
        distance={2.6}
        decay={2}
        color={brandColors.accentSoft}
      />
    </group>
  );
}

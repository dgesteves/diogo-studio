"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";

export function Chair(): ReactElement {
  return (
    <group position={[0, 0, 0.95]}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.025, 24]} />
        <meshStandardMaterial color="#13181d" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.26, 12]} />
        <meshStandardMaterial color="#1c242b" roughness={0.5} metalness={0.5} />
      </mesh>
      <RoundedBox args={[0.5, 0.06, 0.46]} radius={0.03} smoothness={2} position={[0, 0.34, 0]}>
        <meshStandardMaterial color="#0e1418" roughness={0.65} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.48, 0.6, 0.06]} radius={0.05} smoothness={2} position={[0, 0.66, 0.22]}>
        <meshStandardMaterial color="#0e1418" roughness={0.65} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}

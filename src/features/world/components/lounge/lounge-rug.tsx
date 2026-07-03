"use client";

import { type ReactElement } from "react";

const RUG_CENTER_Z = 0.2;

export function LoungeRug(): ReactElement {
  return (
    <group position={[0, 0, RUG_CENTER_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[3.6, 3.0]} />
        <meshStandardMaterial color="#0c141b" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <ringGeometry args={[1.28, 1.4, 48]} />
        <meshStandardMaterial color="#1d4a56" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

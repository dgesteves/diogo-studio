"use client";

import { type ReactElement } from "react";
import { brandColors } from "@/config/brand";

export function LoungeRug(): ReactElement {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[3.6, 2.7]} />
        <meshStandardMaterial color="#0c141b" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <ringGeometry args={[1.62, 1.66, 48]} />
        <meshBasicMaterial
          color={brandColors.accent}
          toneMapped={false}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}

"use client";

import { type ReactElement } from "react";

export function GridFloor(): ReactElement {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#070b0e" roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[16, 32, "#1a2530", "#0e1620"]} position={[0, 0.001, 0]} />
      <gridHelper args={[5, 20, "#1a2a36", "#0b141d"]} position={[0, 0.002, 0]} />
    </group>
  );
}

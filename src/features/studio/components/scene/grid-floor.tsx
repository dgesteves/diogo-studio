"use client";

import { type ReactElement } from "react";

/**
 * Deliberately not `MeshReflectorMaterial`: it re-rendered the whole scene into a
 * 256px buffer every frame (~227 extra draw calls, ~47% of the frame's total) and
 * with `mirror={0}` / `mixStrength={0.45}` its only output was multiplying this
 * near-black color by at most 1.45 — imperceptible for half the frame budget.
 */
export function GridFloor(): ReactElement {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#070b0e" roughness={0.9} metalness={0.2} />
      </mesh>
      <gridHelper args={[16, 32, "#1a2530", "#0e1620"]} position={[0, 0.001, 0]} />
      <gridHelper args={[5, 20, "#1a2a36", "#0b141d"]} position={[0, 0.002, 0]} />
    </group>
  );
}

"use client";

import { type ReactElement } from "react";
import { MeshReflectorMaterial } from "@react-three/drei";

export function GridFloor(): ReactElement {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <MeshReflectorMaterial
          color="#070b0e"
          resolution={256}
          mixBlur={1}
          mixStrength={0.45}
          blur={[420, 220]}
          roughness={0.9}
          metalness={0.2}
          depthScale={0.7}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.2}
          mirror={0}
        />
      </mesh>
      <gridHelper args={[16, 32, "#1a2530", "#0e1620"]} position={[0, 0.001, 0]} />
      <gridHelper args={[5, 20, "#1a2a36", "#0b141d"]} position={[0, 0.002, 0]} />
    </group>
  );
}

"use client";

import { useState, type ReactElement } from "react";
import { Object3D } from "three";

const WARM_LIGHT = "#ffd2a8";
const WARM_BULB = "#ffe6c2";
const SHADE_GLOW = "#ffcaa0";
const METAL = { color: "#14191f", roughness: 0.5, metalness: 0.6 } as const;
const SHADE_POS: [number, number, number] = [0.16, 2.43, 0];
const TARGET_POS: [number, number, number] = [0.03, 0.7, 0];

export function ShelfLight(): ReactElement {
  const [target] = useState(() => new Object3D());

  return (
    <group>
      <mesh position={[-0.05, 2.315, 0]}>
        <boxGeometry args={[0.08, 0.03, 0.12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[-0.05, 2.38, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.12, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0.06, 2.43, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.24, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={SHADE_POS} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.036, 0.036, 0.74, 20]} />
        <meshStandardMaterial
          color="#7a5d35"
          emissive={SHADE_GLOW}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.16, 2.405, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.7, 16]} />
        <meshStandardMaterial
          color="#6a4f28"
          emissive={WARM_BULB}
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      <primitive object={target} position={TARGET_POS} />
      <spotLight
        position={SHADE_POS}
        target={target}
        angle={1.0}
        penumbra={0.75}
        intensity={9}
        distance={4.6}
        decay={2}
        color={WARM_LIGHT}
      />
      <pointLight
        position={[0.5, 1.1, 0]}
        intensity={2.4}
        distance={2.8}
        decay={2}
        color={WARM_LIGHT}
      />
    </group>
  );
}

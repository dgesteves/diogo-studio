"use client";

import { type ReactElement } from "react";
import { DoubleSide } from "three";

import { DESK_TOP_Y, METAL } from "./constants";
import { Headphones, ServerNode } from "./desk-fixtures";

export function DeskExtras(): ReactElement {
  return (
    <group>
      <DeskLamp />
      <Headphones />
      <ServerNode />
    </group>
  );
}

function DeskLamp(): ReactElement {
  return (
    <group position={[-1.36, DESK_TOP_Y, 0.3]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.016, 24]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.54, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.55, 0.2]} rotation={[Math.PI / 2.6, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.48, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <group position={[0, 0.6, 0.4]}>
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.065, 0.09, 20, 1, true]} />
          <meshStandardMaterial {...METAL} side={DoubleSide} />
        </mesh>
        <mesh position={[0, -0.03, 0.01]}>
          <sphereGeometry args={[0.026, 16, 16]} />
          <meshBasicMaterial color="#ffca7a" toneMapped={false} />
        </mesh>
        <pointLight
          position={[0, -0.06, 0.02]}
          intensity={0.7}
          distance={1.5}
          decay={2}
          color="#ffb774"
        />
      </group>
    </group>
  );
}

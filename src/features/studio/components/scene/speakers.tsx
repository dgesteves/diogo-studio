"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";

import { DESK_TOP_Y } from "./constants";

export function Speakers(): ReactElement {
  return (
    <>
      <Speaker position={[-1.45, DESK_TOP_Y + 0.16, -0.3]} />
      <Speaker position={[1.45, DESK_TOP_Y + 0.16, -0.3]} />
    </>
  );
}

function Speaker({ position }: { position: [number, number, number] }): ReactElement {
  return (
    <group position={position}>
      <RoundedBox args={[0.14, 0.32, 0.14]} radius={0.012} smoothness={2}>
        <meshStandardMaterial color="#0a0e12" roughness={0.6} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, -0.04, 0.072]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.044, 0.044, 0.006, 24]} />
        <meshStandardMaterial color="#040608" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.04, 0.073]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.04, 0.005, 8, 24]} />
        <meshStandardMaterial color="#1a2530" roughness={0.5} metalness={0.55} />
      </mesh>
      <mesh position={[0, -0.04, 0.076]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.003, 16]} />
        <meshStandardMaterial color="#22303a" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.09, 0.072]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.005, 16]} />
        <meshStandardMaterial color="#040608" roughness={0.7} metalness={0.5} />
      </mesh>
      <mesh position={[0.045, -0.14, 0.072]}>
        <sphereGeometry args={[0.0035, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
    </group>
  );
}

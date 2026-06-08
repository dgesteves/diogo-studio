"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { DESK_TOP_Y } from "./constants";

export function CoffeeMug(): ReactElement {
  return (
    <group position={[0.95, DESK_TOP_Y, 0.3]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.05, 0.044, 0.12, 24]} />
        <meshStandardMaterial color="#1a2a36" roughness={0.4} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.119, 0]}>
        <cylinderGeometry args={[0.043, 0.043, 0.004, 24]} />
        <meshStandardMaterial color="#1a0c04" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.121, 0]}>
        <torusGeometry args={[0.044, 0.005, 8, 24]} />
        <meshStandardMaterial color="#0a0608" roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[0.058, 0.06, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.028, 0.0075, 8, 18, Math.PI]} />
        <meshStandardMaterial color="#1a2a36" roughness={0.4} metalness={0.45} />
      </mesh>
    </group>
  );
}

export function PlantPot(): ReactElement {
  return (
    <group position={[-0.95, DESK_TOP_Y, 0.3]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.055, 0.045, 0.1, 20]} />
        <meshStandardMaterial color="#2a1c11" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[0.055, 0.005, 8, 20]} />
        <meshStandardMaterial color="#3a261a" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.097, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.005, 20]} />
        <meshStandardMaterial color="#0c0805" roughness={1} metalness={0} />
      </mesh>
      {FOLIAGE_CLUMPS.map((clump) => (
        <mesh key={clump.position.join(",")} position={clump.position}>
          <icosahedronGeometry args={[clump.radius, 0]} />
          <meshStandardMaterial color={clump.color} roughness={0.6} flatShading />
        </mesh>
      ))}
    </group>
  );
}

type FoliageClump = {
  position: [number, number, number];
  radius: number;
  color: string;
};

const FOLIAGE_CLUMPS: FoliageClump[] = [
  { position: [0, 0.155, 0], radius: 0.058, color: "#1f4a32" },
  { position: [-0.045, 0.168, 0.014], radius: 0.05, color: "#266a44" },
  { position: [0.046, 0.16, -0.014], radius: 0.048, color: "#1a4028" },
  { position: [0.006, 0.166, 0.046], radius: 0.044, color: "#2b6e48" },
  { position: [-0.008, 0.178, -0.044], radius: 0.044, color: "#22573a" },
  { position: [0, 0.198, 0.004], radius: 0.04, color: "#266a44" },
];

export function Notebook(): ReactElement {
  return (
    <group position={[-0.6, DESK_TOP_Y + 0.008, 0.34]}>
      <RoundedBox args={[0.2, 0.012, 0.3]} radius={0.006} smoothness={2}>
        <meshStandardMaterial color="#13181d" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.007, -0.12]}>
        <boxGeometry args={[0.05, 0.001, 0.026]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.011, 0.05]} rotation={[0, 0.4, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.16, 10]} />
        <meshStandardMaterial color="#1a2530" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

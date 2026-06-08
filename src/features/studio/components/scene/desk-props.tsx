"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { DESK_TOP_Y } from "./constants";

export function DeskProps(): ReactElement {
  return (
    <group>
      <Keyboard />
      <Mouse />
      <CoffeeMug />
      <PlantPot />
      <Notebook />
    </group>
  );
}

const KEY_ROW_OFFSETS = [-0.08, -0.02, 0.04, 0.1];

function Keyboard(): ReactElement {
  return (
    <group position={[-0.05, DESK_TOP_Y + 0.011, 0.32]}>
      <RoundedBox args={[1.05, 0.022, 0.32]} radius={0.008} smoothness={2}>
        <meshStandardMaterial color="#0a0e12" roughness={0.6} metalness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.98, 0.004, 0.26]} />
        <meshStandardMaterial color="#040608" roughness={0.4} metalness={0.5} />
      </mesh>
      {KEY_ROW_OFFSETS.map((z) => (
        <mesh key={z} position={[0, 0.0144, z]}>
          <boxGeometry args={[0.92, 0.0015, 0.005]} />
          <meshStandardMaterial color="#1a2530" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.0155, -0.13]}>
        <boxGeometry args={[0.92, 0.001, 0.005]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.0146, 0.105]}>
        <boxGeometry args={[0.36, 0.002, 0.026]} />
        <meshStandardMaterial color="#1a2530" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}

const MOUSE_UNDERGLOW_DOTS = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2;
  return {
    angle,
    x: Math.cos(angle) * 0.052,
    z: Math.sin(angle) * 0.078,
  };
});

function Mouse(): ReactElement {
  return (
    <group position={[0.6, DESK_TOP_Y + 0.013, 0.34]}>
      <RoundedBox args={[0.085, 0.026, 0.135]} radius={0.014} smoothness={2}>
        <meshStandardMaterial color="#0a0e12" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.0145, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.022, 10]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.0136, 0.026]}>
        <boxGeometry args={[0.026, 0.001, 0.05]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      {MOUSE_UNDERGLOW_DOTS.map((dot) => (
        <mesh key={dot.angle} position={[dot.x, -0.011, dot.z]}>
          <sphereGeometry args={[0.004, 8, 8]} />
          <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
        </mesh>
      ))}
      <pointLight
        position={[0, -0.02, 0]}
        intensity={0.28}
        distance={0.55}
        decay={2}
        color={brandColors.accent}
      />
    </group>
  );
}

function CoffeeMug(): ReactElement {
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

function PlantPot(): ReactElement {
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
      <mesh position={[0, 0.16, 0]}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial color="#1f4a32" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[-0.035, 0.18, 0.025]}>
        <icosahedronGeometry args={[0.05, 0]} />
        <meshStandardMaterial color="#266a44" roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0.03, 0.185, -0.022]}>
        <icosahedronGeometry args={[0.045, 0]} />
        <meshStandardMaterial color="#1a4028" roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

function Notebook(): ReactElement {
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

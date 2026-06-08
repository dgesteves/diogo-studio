"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { DESK_TOP_Y } from "./constants";

const KEY_ROW_OFFSETS = [-0.08, -0.02, 0.04, 0.1];

export function Keyboard(): ReactElement {
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

export function Mouse(): ReactElement {
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

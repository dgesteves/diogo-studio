"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { DESK_TOP_Y } from "./constants";

const WEBCAM_Y = DESK_TOP_Y + 0.78;

export function Webcam(): ReactElement {
  return (
    <group position={[0, WEBCAM_Y, -0.34]}>
      <RoundedBox
        args={[0.12, 0.04, 0.05]}
        radius={0.01}
        smoothness={2}
        position={[0, 0.022, 0.006]}
      >
        <meshStandardMaterial color="#0a0e12" roughness={0.5} metalness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.022, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.017, 0.014, 24]} />
        <meshStandardMaterial color="#05080a" roughness={0.55} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.022, 0.038]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.003, 24]} />
        <meshStandardMaterial color="#0a2630" roughness={0.18} metalness={0.75} />
      </mesh>
      <mesh position={[0, 0.022, 0.0395]}>
        <torusGeometry args={[0.013, 0.0016, 8, 28]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0.045, 0.022, 0.031]}>
        <sphereGeometry args={[0.0035, 10, 10]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.003, -0.028]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.085, 0.055, 0.008]} />
        <meshStandardMaterial color="#0a0e12" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

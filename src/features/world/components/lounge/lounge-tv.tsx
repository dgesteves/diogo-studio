"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { CONSOLE_Z, TV_CENTER_Y, TV_WALL_Z, WOOD } from "./constants";
import { useLoungeTvTexture } from "./use-lounge-tv-texture";

const CONSOLE_W = 1.9;
const CONSOLE_H = 0.4;
const CONSOLE_D = 0.4;
const TV_W = 1.7;
const TV_H = 0.98;
const TV_Z = TV_WALL_Z;

export function LoungeTv(): ReactElement {
  const screen = useLoungeTvTexture();

  return (
    <group>
      <group position={[0, 0, CONSOLE_Z]}>
        <RoundedBox
          args={[CONSOLE_W, CONSOLE_H, CONSOLE_D]}
          radius={0.02}
          smoothness={3}
          position={[0, CONSOLE_H / 2 + 0.02, 0]}
          castShadow
        >
          <meshStandardMaterial {...WOOD} />
        </RoundedBox>
        <mesh position={[0, 0.12, CONSOLE_D / 2 + 0.001]}>
          <boxGeometry args={[CONSOLE_W - 0.1, 0.01, 0.004]} />
          <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
        </mesh>
      </group>

      <group position={[0, TV_CENTER_Y, TV_Z]}>
        <RoundedBox args={[TV_W, TV_H, 0.05]} radius={0.012} smoothness={3} castShadow>
          <meshStandardMaterial color="#0a0f13" roughness={0.4} metalness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[TV_W - 0.1, TV_H - 0.1]} />
          <meshStandardMaterial
            map={screen}
            emissive="#ffffff"
            emissiveMap={screen}
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      </group>

      <pointLight
        position={[0, TV_CENTER_Y, TV_Z + 0.9]}
        intensity={0.65}
        distance={3.6}
        decay={2}
        color={brandColors.accent}
      />
    </group>
  );
}

"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import type { Texture } from "three";

import { useCenterScreenTexture, useLeftScreenTexture, useRightScreenTexture } from "../screens";

export function MonitorRig(): ReactElement {
  const leftTexture = useLeftScreenTexture();
  const centerTexture = useCenterScreenTexture();
  const rightTexture = useRightScreenTexture();

  return (
    <>
      <Monitor
        position={[-1.05, 0.95, -0.18]}
        rotation={[0, 0.42, 0]}
        size="small"
        screenTexture={leftTexture}
      />
      <Monitor
        position={[0, 1.0, -0.35]}
        rotation={[0, 0, 0]}
        size="large"
        screenTexture={centerTexture}
      />
      <Monitor
        position={[1.05, 0.95, -0.18]}
        rotation={[0, -0.42, 0]}
        size="small"
        screenTexture={rightTexture}
      />
    </>
  );
}

type MonitorSize = "small" | "large";

const MONITOR_SIZES: Record<MonitorSize, { w: number; h: number; bezel: number; standH: number }> =
  {
    small: { w: 0.78, h: 0.5, bezel: 0.02, standH: 0.22 },
    large: { w: 1.05, h: 0.62, bezel: 0.022, standH: 0.22 },
  };

function Monitor({
  position,
  rotation = [0, 0, 0],
  size = "large",
  screenTexture,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: MonitorSize;
  screenTexture: Texture;
}): ReactElement {
  const { w, h, bezel, standH } = MONITOR_SIZES[size];
  const innerW = w - bezel * 2;
  const innerH = h - bezel * 2;

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w, h, 0.04]} radius={0.012} smoothness={2}>
        <meshStandardMaterial color="#0a0f13" roughness={0.4} metalness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, 0.0215]}>
        <planeGeometry args={[innerW, innerH]} />
        <meshStandardMaterial
          map={screenTexture}
          emissive="#ffffff"
          emissiveMap={screenTexture}
          emissiveIntensity={1.05}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -h / 2 - standH / 2, -0.02]}>
        <boxGeometry args={[0.06, standH, 0.04]} />
        <meshStandardMaterial color="#13181d" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, -h / 2 - standH - 0.01, -0.02]}>
        <cylinderGeometry args={[0.16, 0.16, 0.015, 18]} />
        <meshStandardMaterial color="#13181d" roughness={0.65} metalness={0.4} />
      </mesh>
    </group>
  );
}

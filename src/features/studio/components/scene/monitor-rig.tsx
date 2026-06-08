"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import type { Texture } from "three";
import { brandColors } from "@/config/brand";

import { useCenterScreenTexture, useLeftScreenTexture, useRightScreenTexture } from "../screens";
import { DESK_TOP_Y } from "./constants";

const MONITOR_Y = DESK_TOP_Y + 0.47;
const WEBCAM_Y = DESK_TOP_Y + 0.78;

export function MonitorRig(): ReactElement {
  const leftTexture = useLeftScreenTexture();
  const centerTexture = useCenterScreenTexture();
  const rightTexture = useRightScreenTexture();

  return (
    <>
      <Monitor
        position={[-1.044, MONITOR_Y, -0.262]}
        rotation={[0, 0.15, 0]}
        size="large"
        screenTexture={leftTexture}
      />
      <Monitor
        position={[0, MONITOR_Y, -0.34]}
        rotation={[0, 0, 0]}
        size="large"
        screenTexture={centerTexture}
      />
      <Monitor
        position={[1.044, MONITOR_Y, -0.262]}
        rotation={[0, -0.15, 0]}
        size="large"
        screenTexture={rightTexture}
      />
      <Webcam />
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
      <pointLight
        position={[0, -0.12, 0.5]}
        intensity={0.4}
        distance={1.9}
        decay={2}
        color={brandColors.accent}
      />
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

function Webcam(): ReactElement {
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

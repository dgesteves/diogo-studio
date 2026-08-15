"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { type Texture } from "three";
import { worldColors } from "../materials";
import { DESK_TOP_Y } from "../room";
import { useLeftScreenTexture } from "../screens/code-screen";
import { useRightScreenTexture } from "../screens/metrics-screen";
import { useCenterScreenTexture } from "../screens/terminal-screen";

/**
 * The two displays and the webcam clipped to them. The screens themselves are canvas textures
 * drawn in `world/screens/` — this file owns the physical rig and nothing that is painted.
 */

const WEBCAM_Y = DESK_TOP_Y + 0.78;
const BODY_WIDTH = 0.168;
const BODY_HEIGHT = 0.052;
const BODY_DEPTH = 0.062;
const BODY_Y = 0.03;
const BODY_Z = 0.008;
const BODY_FRONT = BODY_Z + BODY_DEPTH / 2;
const MIC_SLOT_OFFSETS = [-0.062, -0.05];
const SHELL_MATERIAL = { color: "#0a0e12", roughness: 0.5, metalness: 0.5 } as const;

function Webcam(): ReactElement {
  return (
    <group position={[0, WEBCAM_Y, -0.34]}>
      <RoundedBox
        args={[BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH]}
        radius={0.012}
        smoothness={3}
        position={[0, BODY_Y, BODY_Z]}
      >
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </RoundedBox>
      <RoundedBox
        args={[BODY_WIDTH - 0.014, BODY_HEIGHT - 0.01, 0.006]}
        radius={0.003}
        smoothness={2}
        position={[0, BODY_Y, BODY_FRONT]}
      >
        <meshStandardMaterial color="#05080a" roughness={0.62} metalness={0.35} />
      </RoundedBox>
      <mesh position={[0, BODY_Y, BODY_FRONT + 0.007]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.025, 0.02, 28]} />
        <meshStandardMaterial color="#070b0e" roughness={0.45} metalness={0.6} />
      </mesh>
      <mesh position={[0, BODY_Y, BODY_FRONT + 0.014]} scale={[1, 1, 0.45]}>
        <sphereGeometry args={[0.017, 24, 16]} />
        <meshStandardMaterial color="#04141c" roughness={0.08} metalness={0.9} />
      </mesh>
      <mesh position={[0, BODY_Y, BODY_FRONT + 0.0155]}>
        <torusGeometry args={[0.0185, 0.0016, 8, 32]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0.004, BODY_Y + 0.004, BODY_FRONT + 0.021]}>
        <sphereGeometry args={[0.0026, 10, 10]} />
        <meshBasicMaterial color={worldColors.accentBright} toneMapped={false} />
      </mesh>
      {MIC_SLOT_OFFSETS.map((x) => (
        <mesh key={x} position={[x, BODY_Y, BODY_FRONT + 0.0025]}>
          <boxGeometry args={[0.004, 0.02, 0.002]} />
          <meshStandardMaterial color="#030608" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      <mesh position={[0.058, BODY_Y, BODY_FRONT + 0.002]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.004, 16]} />
        <meshStandardMaterial color="#030608" roughness={0.85} metalness={0.15} />
      </mesh>
      <mesh position={[0.058, BODY_Y, BODY_FRONT + 0.0035]}>
        <sphereGeometry args={[0.0028, 10, 10]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <RoundedBox
        args={[0.11, 0.07, 0.008]}
        radius={0.003}
        smoothness={2}
        position={[0, 0.004, -0.03]}
        rotation={[0.32, 0, 0]}
      >
        <meshStandardMaterial {...SHELL_MATERIAL} />
      </RoundedBox>
      <mesh position={[0, -0.026, -0.016]}>
        <boxGeometry args={[0.09, 0.006, 0.026]} />
        <meshStandardMaterial color="#0d1216" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}

const MONITOR_Y = DESK_TOP_Y + 0.47;

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
      <pointLight
        position={[0, MONITOR_Y - 0.12, 0.2]}
        intensity={0.9}
        distance={2.6}
        decay={2}
        color={worldColors.accent}
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

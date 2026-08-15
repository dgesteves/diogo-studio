"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { worldColors } from "@/world/materials";

import {
  HARDWARE_DEPTH,
  SERVER_BODY_CENTER_Y,
  SERVER_BODY_HEIGHT,
  SERVER_FOOT_HEIGHT,
  SERVER_WIDTH,
} from "./desk-hardware-layout";
import { StatusLed } from "./status-led";

const FRONT_Z = HARDWARE_DEPTH / 2;
const BEZEL_Z = FRONT_Z - 0.0025;
const TRAY_WIDTH = 0.058;
const TRAY_HEIGHT = 0.126;
const TRAY_DEPTH = 0.012;
const TRAY_FACE_Z = FRONT_Z + 0.002;
const TRAY_Z = TRAY_FACE_Z - TRAY_DEPTH / 2;
const LED_X = SERVER_WIDTH / 2 - 0.018;
const LED_Z = FRONT_Z + 0.0006;
const TRAY_MATERIAL = { color: "#151c23", roughness: 0.55, metalness: 0.42 } as const;

const TRAY_X = [-0.045, 0.017] as const;
const TRAY_SLOT_Y = [0.03, 0, -0.03] as const;

const LEDS = [
  { y: 0.13, color: worldColors.accent, blinkSpeed: 0 },
  { y: 0.108, color: worldColors.statusOk, blinkSpeed: 1.1 },
  { y: 0.086, color: worldColors.statusOk, blinkSpeed: 6.2 },
  { y: 0.064, color: worldColors.statusOk, blinkSpeed: 8.7 },
] as const;

export function ServerNodeFront(): ReactElement {
  return (
    <>
      <mesh position={[0, SERVER_BODY_CENTER_Y, BEZEL_Z]}>
        <boxGeometry args={[SERVER_WIDTH - 0.012, SERVER_BODY_HEIGHT - 0.012, 0.005]} />
        <meshStandardMaterial color="#05080b" roughness={0.85} metalness={0.25} />
      </mesh>
      {TRAY_X.map((x) => (
        <DriveTray key={x} x={x} />
      ))}
      {LEDS.map((led, index) => (
        <StatusLed
          key={led.y}
          position={[LED_X, led.y, LED_Z]}
          color={led.color}
          radius={0.0025}
          blinkSpeed={led.blinkSpeed}
          phase={index * 1.9}
        />
      ))}
      <mesh position={[0, SERVER_FOOT_HEIGHT + 0.004, LED_Z]}>
        <boxGeometry args={[SERVER_WIDTH * 0.5, 0.0009, 0.002]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
    </>
  );
}

function DriveTray({ x }: { x: number }): ReactElement {
  return (
    <group position={[x, SERVER_BODY_CENTER_Y, TRAY_Z]}>
      <RoundedBox args={[TRAY_WIDTH, TRAY_HEIGHT, TRAY_DEPTH]} radius={0.0035} smoothness={2}>
        <meshStandardMaterial {...TRAY_MATERIAL} />
      </RoundedBox>
      <mesh position={[-TRAY_WIDTH / 2 + 0.008, 0, TRAY_DEPTH / 2 - 0.0005]}>
        <boxGeometry args={[0.0045, TRAY_HEIGHT - 0.02, 0.0035]} />
        <meshStandardMaterial color="#04070a" roughness={0.9} metalness={0.15} />
      </mesh>
      {TRAY_SLOT_Y.map((y) => (
        <mesh key={y} position={[0.008, y, TRAY_DEPTH / 2 - 0.0004]}>
          <boxGeometry args={[TRAY_WIDTH * 0.52, 0.0022, 0.0025]} />
          <meshStandardMaterial color="#080d12" roughness={0.9} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

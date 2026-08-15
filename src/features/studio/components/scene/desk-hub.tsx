"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { anodizedMetalMaterial, worldColors, portMaterial } from "@/world/materials";

import { DESK_TOP_Y } from "@/world/room";
import { HARDWARE_CENTER_Z, HUB_DEPTH, HUB_HEIGHT, HUB_WIDTH, HUB_X } from "./desk-hardware-layout";
import { StatusLed } from "./status-led";

const FOOT_HEIGHT = 0.005;
const BODY_HEIGHT = HUB_HEIGHT - FOOT_HEIGHT;
const BODY_CENTER_Y = FOOT_HEIGHT + BODY_HEIGHT / 2;
const FRONT_Z = HUB_DEPTH / 2;
const PORT_Y = FOOT_HEIGHT + BODY_HEIGHT * 0.48;
const PORT_HEIGHT = 0.0036;
const FOOT_X = HUB_WIDTH / 2 - 0.016;
const FOOT_Z = HUB_DEPTH / 2 - 0.022;

const FRONT_PORTS = [
  { x: -0.03, width: 0.028, height: PORT_HEIGHT },
  { x: 0.002, width: 0.0165, height: 0.0072 },
  { x: 0.024, width: 0.0114, height: PORT_HEIGHT },
  { x: 0.043, width: 0.0114, height: PORT_HEIGHT },
] as const;

const FEET = [
  [-FOOT_X, -FOOT_Z],
  [FOOT_X, -FOOT_Z],
  [-FOOT_X, FOOT_Z],
  [FOOT_X, FOOT_Z],
] as const;

export function DeskHub(): ReactElement {
  return (
    <group position={[HUB_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
      {FEET.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, FOOT_HEIGHT / 2, z]}>
          <cylinderGeometry args={[0.006, 0.0065, FOOT_HEIGHT, 12]} />
          <meshStandardMaterial color="#05080b" roughness={0.95} metalness={0.05} />
        </mesh>
      ))}
      <RoundedBox
        args={[HUB_WIDTH, BODY_HEIGHT, HUB_DEPTH]}
        radius={0.005}
        smoothness={3}
        position={[0, BODY_CENTER_Y, 0]}
      >
        <meshStandardMaterial {...anodizedMetalMaterial} />
      </RoundedBox>
      <mesh position={[0, HUB_HEIGHT - 0.0008, 0]}>
        <boxGeometry args={[HUB_WIDTH - 0.018, 0.0018, HUB_DEPTH - 0.03]} />
        <meshStandardMaterial color="#0d1318" roughness={0.72} metalness={0.35} />
      </mesh>
      <mesh position={[0, HUB_HEIGHT + 0.0004, FRONT_Z - 0.034]}>
        <boxGeometry args={[HUB_WIDTH * 0.42, 0.0008, 0.0022]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <FrontPanel />
    </group>
  );
}

function FrontPanel(): ReactElement {
  return (
    <group position={[0, 0, FRONT_Z]}>
      {FRONT_PORTS.map((port) => (
        <mesh key={port.x} position={[port.x, PORT_Y, -0.0015]}>
          <boxGeometry args={[port.width, port.height, 0.004]} />
          <meshStandardMaterial {...portMaterial} />
        </mesh>
      ))}
      <StatusLed
        position={[-0.054, PORT_Y, 0.0012]}
        color={worldColors.accentBright}
        radius={0.0024}
        blinkSpeed={1.6}
      />
    </group>
  );
}

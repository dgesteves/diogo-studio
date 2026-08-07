"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";
import { brandColors } from "@/config/brand";

import { ANODIZED, DESK_TOP_Y, PORT } from "./constants";
import {
  HARDWARE_CENTER_Z,
  HARDWARE_DEPTH,
  MAC_STUDIO_HEIGHT,
  MAC_STUDIO_WIDTH,
  MAC_STUDIO_X,
} from "./desk-hardware-layout";
import { StatusLed } from "./status-led";

const PEDESTAL_HEIGHT = 0.019;
const PEDESTAL_RADIUS = MAC_STUDIO_WIDTH * 0.42;
const BODY_HEIGHT = MAC_STUDIO_HEIGHT - PEDESTAL_HEIGHT;
const BODY_CENTER_Y = PEDESTAL_HEIGHT + BODY_HEIGHT / 2;
const FRONT_Z = HARDWARE_DEPTH / 2;
const PORT_Y = PEDESTAL_HEIGHT + BODY_HEIGHT * 0.34;
const PORT_HEIGHT = 0.0036;
const SD_SLOT_WIDTH = 0.032;
const USB_C_WIDTH = 0.0114;

const FRONT_PORTS = [
  { x: -0.05, width: SD_SLOT_WIDTH },
  { x: 0.026, width: USB_C_WIDTH },
  { x: 0.05, width: USB_C_WIDTH },
] as const;

export function MacStudio(): ReactElement {
  return (
    <group position={[MAC_STUDIO_X, DESK_TOP_Y, HARDWARE_CENTER_Z]}>
      <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[PEDESTAL_RADIUS, PEDESTAL_RADIUS, PEDESTAL_HEIGHT, 32]} />
        <meshStandardMaterial color="#0a0e12" roughness={0.75} metalness={0.3} />
      </mesh>
      <mesh position={[0, PEDESTAL_HEIGHT * 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PEDESTAL_RADIUS - 0.006, 0.0022, 8, 40]} />
        <meshStandardMaterial color="#161c22" roughness={0.6} metalness={0.5} />
      </mesh>
      <RoundedBox
        args={[MAC_STUDIO_WIDTH, BODY_HEIGHT, HARDWARE_DEPTH]}
        radius={0.017}
        smoothness={4}
        position={[0, BODY_CENTER_Y, 0]}
      >
        <meshStandardMaterial {...ANODIZED} />
      </RoundedBox>
      <mesh position={[0, PEDESTAL_HEIGHT + 0.0015, 0]}>
        <boxGeometry args={[MAC_STUDIO_WIDTH - 0.014, 0.003, HARDWARE_DEPTH - 0.014]} />
        <meshStandardMaterial color="#0a0f14" roughness={0.5} metalness={0.55} />
      </mesh>
      <FrontPanel />
      <mesh position={[0, BODY_CENTER_Y, -FRONT_Z - 0.0005]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[MAC_STUDIO_WIDTH - 0.03, BODY_HEIGHT - 0.026]} />
        <meshStandardMaterial color="#0b1015" roughness={0.85} metalness={0.35} />
      </mesh>
    </group>
  );
}

function FrontPanel(): ReactElement {
  return (
    <group position={[0, 0, FRONT_Z]}>
      {FRONT_PORTS.map((port) => (
        <mesh key={port.x} position={[port.x, PORT_Y, -0.0015]}>
          <boxGeometry args={[port.width, PORT_HEIGHT, 0.004]} />
          <meshStandardMaterial {...PORT} />
        </mesh>
      ))}
      <mesh position={[0, PEDESTAL_HEIGHT + 0.0022, -0.001]}>
        <boxGeometry args={[MAC_STUDIO_WIDTH * 0.34, 0.0009, 0.002]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>
      <StatusLed
        position={[-0.104, PORT_Y, 0.0012]}
        color={brandColors.coolLightCore}
        radius={0.0022}
      />
    </group>
  );
}

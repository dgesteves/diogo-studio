"use client";

import { type ReactElement } from "react";
import { Instance, Instances, RoundedBox } from "@react-three/drei";
import { worldColors } from "@/world/materials";

import { DESK_TOP_Y } from "@/world/room";
import {
  KEYCAPS,
  KEYCAP_DEPTH,
  KEYCAP_HEIGHT,
  KEY_FIELD_DEPTH,
  KEY_FIELD_WIDTH,
} from "./keyboard-layout";
import { useKeyboardLegendTexture } from "./keyboard-legend";

const CASE_BEZEL = 0.026;
const CASE_WIDTH = KEY_FIELD_WIDTH + CASE_BEZEL * 2;
const CASE_DEPTH = KEY_FIELD_DEPTH + CASE_BEZEL * 2;
const CASE_HEIGHT = 0.016;
const DECK_TOP = CASE_HEIGHT / 2;
const CAP_Y = DECK_TOP + KEYCAP_HEIGHT / 2 - 0.0012;
const LEGEND_Y = CAP_Y + KEYCAP_HEIGHT / 2 + 0.0004;

export function Keyboard(): ReactElement {
  const legendTexture = useKeyboardLegendTexture();

  return (
    <group position={[-0.05, DESK_TOP_Y + DECK_TOP, 0.34]}>
      <RoundedBox args={[CASE_WIDTH, CASE_HEIGHT, CASE_DEPTH]} radius={0.005} smoothness={2}>
        <meshStandardMaterial color="#0b1014" roughness={0.62} metalness={0.32} />
      </RoundedBox>
      <mesh position={[0, DECK_TOP - 0.0012, 0]}>
        <boxGeometry args={[KEY_FIELD_WIDTH + 0.008, 0.003, KEY_FIELD_DEPTH + 0.008]} />
        <meshStandardMaterial
          color="#04121a"
          emissive={worldColors.accent}
          emissiveIntensity={0.85}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      <KeycapField />
      <mesh position={[0, LEGEND_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[KEY_FIELD_WIDTH, KEY_FIELD_DEPTH]} />
        <meshBasicMaterial map={legendTexture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, DECK_TOP - 0.0016, -CASE_DEPTH / 2 + 0.009]}>
        <boxGeometry args={[KEY_FIELD_WIDTH * 0.5, 0.0008, 0.0022]} />
        <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
      </mesh>
      <pointLight
        position={[0, -0.012, 0.02]}
        intensity={0.18}
        distance={0.45}
        decay={2}
        color={worldColors.accent}
      />
    </group>
  );
}

function KeycapField(): ReactElement {
  return (
    <Instances limit={KEYCAPS.length} position={[0, CAP_Y, 0]}>
      <boxGeometry args={[1, KEYCAP_HEIGHT, KEYCAP_DEPTH]} />
      <meshStandardMaterial color="#ffffff" roughness={0.82} metalness={0.12} />
      {KEYCAPS.map((cap) => (
        <Instance
          key={cap.id}
          color={cap.shade}
          position={[cap.x, 0, cap.z]}
          rotation={[cap.tilt, 0, 0]}
          scale={[cap.width, 1, 1]}
        />
      ))}
    </Instances>
  );
}

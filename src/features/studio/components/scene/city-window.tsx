"use client";

import { type ReactElement } from "react";
import { brandColors } from "@/config/brand";

import { CITY_WINDOW, LEFT_WALL } from "./constants";
import { Cityscape } from "./cityscape";

const W = CITY_WINDOW.width;
const H = CITY_WINDOW.height;
const FRAME = 0.07;
const FRAME_DEPTH = 0.14;
const MULLION = 0.035;
const FRAME_COLOR = "#0b1016";

type Bar = { size: [number, number, number]; position: [number, number, number] };

const FRAME_BARS: Bar[] = [
  { size: [W + FRAME * 2, FRAME, FRAME_DEPTH], position: [0, H / 2 + FRAME / 2, 0] },
  { size: [W + FRAME * 2, FRAME, FRAME_DEPTH], position: [0, -H / 2 - FRAME / 2, 0] },
  { size: [FRAME, H + FRAME * 2, FRAME_DEPTH], position: [-W / 2 - FRAME / 2, 0, 0] },
  { size: [FRAME, H + FRAME * 2, FRAME_DEPTH], position: [W / 2 + FRAME / 2, 0, 0] },
];

const MULLION_BARS: Bar[] = [
  { size: [MULLION, H, MULLION * 1.6], position: [-W / 4, 0, 0] },
  { size: [MULLION, H, MULLION * 1.6], position: [W / 4, 0, 0] },
  { size: [W, MULLION, MULLION * 1.6], position: [0, 0, 0] },
];

export function CityWindow(): ReactElement {
  return (
    <group
      position={[LEFT_WALL.x, CITY_WINDOW.centerY, CITY_WINDOW.centerZ]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <Cityscape />

      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial
          color={brandColors.accent}
          transparent
          opacity={0.05}
          roughness={0.08}
          metalness={0}
          depthWrite={false}
        />
      </mesh>

      {[...FRAME_BARS, ...MULLION_BARS].map((bar) => (
        <mesh key={`${bar.position.join(",")}:${bar.size.join(",")}`} position={bar.position}>
          <boxGeometry args={bar.size} />
          <meshStandardMaterial color={FRAME_COLOR} roughness={0.5} metalness={0.6} />
        </mesh>
      ))}

      <mesh position={[0, -H / 2 - FRAME / 2, FRAME_DEPTH / 2]}>
        <boxGeometry args={[W, 0.012, 0.012]} />
        <meshBasicMaterial color={brandColors.accent} toneMapped={false} />
      </mesh>

      <pointLight position={[0, 0.1, 0.6]} intensity={0.5} distance={5} decay={2} color="#bfe9ff" />
    </group>
  );
}

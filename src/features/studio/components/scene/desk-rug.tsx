"use client";

import { type ReactElement } from "react";

const WIDTH = 3.5;
const DEPTH = 2.3;
const CENTER_Z = 0.4;
const BAND = 0.08;
const INSET = 0.14;
const BASE_Y = 0.012;
const BAND_Y = 0.014;
const BASE_COLOR = "#0c141b";
const BAND_COLOR = "#1d4a56";

const BAND_STRIPS = [
  { position: [0, BAND_Y, DEPTH / 2 - INSET - BAND / 2], size: [WIDTH - INSET * 2, BAND] },
  { position: [0, BAND_Y, -(DEPTH / 2 - INSET - BAND / 2)], size: [WIDTH - INSET * 2, BAND] },
  {
    position: [WIDTH / 2 - INSET - BAND / 2, BAND_Y, 0],
    size: [BAND, DEPTH - INSET * 2 - BAND * 2],
  },
  {
    position: [-(WIDTH / 2 - INSET - BAND / 2), BAND_Y, 0],
    size: [BAND, DEPTH - INSET * 2 - BAND * 2],
  },
] as const;

export function DeskRug(): ReactElement {
  return (
    <group position={[0, 0, CENTER_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BASE_Y, 0]} receiveShadow>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshStandardMaterial color={BASE_COLOR} roughness={0.95} metalness={0} />
      </mesh>
      {BAND_STRIPS.map((strip) => (
        <mesh
          key={strip.position.join(",")}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[...strip.position]}
        >
          <planeGeometry args={[...strip.size]} />
          <meshStandardMaterial color={BAND_COLOR} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

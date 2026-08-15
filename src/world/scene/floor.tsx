"use client";

import { type ReactElement } from "react";

/**
 * What the room stands on: the floor plane with its two grids, and the rug that sits on top
 * of it. Both are flat, both are pure receiving surfaces, and their y-offsets are chosen
 * against each other — a few thousandths apart to keep them from z-fighting.
 */

/**
 * Deliberately not `MeshReflectorMaterial`: it re-rendered the whole scene into a
 * 256px buffer every frame (~227 extra draw calls, ~47% of the frame's total) and
 * with `mirror={0}` / `mixStrength={0.45}` its only output was multiplying this
 * near-black color by at most 1.45 — imperceptible for half the frame budget.
 */
export function GridFloor(): ReactElement {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#070b0e" roughness={0.9} metalness={0.2} />
      </mesh>
      <gridHelper args={[16, 32, "#1a2530", "#0e1620"]} position={[0, 0.001, 0]} />
      <gridHelper args={[5, 20, "#1a2a36", "#0b141d"]} position={[0, 0.002, 0]} />
    </group>
  );
}

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

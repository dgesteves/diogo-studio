"use client";

import { type ReactElement } from "react";
import { ROOM } from "../room";

/**
 * What the room stands on: the floor plane with its two grids, and the rug that sits on top
 * of it. Both are flat, both are pure receiving surfaces, and their y-offsets are chosen
 * against each other — a few thousandths apart to keep them from z-fighting.
 */

/**
 * The slab is the room's own footprint and not a meter more. It was a 16 × 12 m plane centered
 * on the world rather than on the room, so it ran eight meters out past the window wall and
 * hung under the city as a lit shelf. The grid is authored as a unit square and scaled onto the
 * footprint for the same reason: `gridHelper` is always square, and the room is not.
 *
 * Deliberately not `MeshReflectorMaterial`: it re-rendered the whole scene into a
 * 256px buffer every frame (~227 extra draw calls, ~47% of the frame's total) and
 * with `mirror={0}` / `mixStrength={0.45}` its only output was multiplying this
 * near-black color by at most 1.45 — imperceptible for half the frame budget.
 */
const GRID_DIVISIONS = 16;
/** The finer grid under the desk, kept inside the shell rather than centered on the world. */
const INNER_GRID_SPAN = 4.4;
const INNER_GRID_DIVISIONS = 18;

export function GridFloor(): ReactElement {
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[ROOM.centerX, -0.001, ROOM.centerZ]}
        receiveShadow
      >
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#070b0e" roughness={0.9} metalness={0.2} />
      </mesh>
      <gridHelper
        args={[1, GRID_DIVISIONS, "#1a2530", "#0e1620"]}
        scale={[ROOM.width, 1, ROOM.depth]}
        position={[ROOM.centerX, 0.001, ROOM.centerZ]}
      />
      <gridHelper
        args={[INNER_GRID_SPAN, INNER_GRID_DIVISIONS, "#1a2a36", "#0b141d"]}
        position={[0, 0.002, 0]}
      />
    </group>
  );
}

const WIDTH = 3.5;
/** Where it stops on the chair's side, clear of the lounge and of the floor lamp's base. */
const NEAR_EDGE_Z = 1.55;
/** Floor left showing at the foot of the shelf wall, so the rug reads as laid, not fitted. */
const WALL_GAP = 0.35;
const FAR_EDGE_Z = ROOM.minZ + WALL_GAP;
const DEPTH = NEAR_EDGE_Z - FAR_EDGE_Z;
const CENTER_Z = (NEAR_EDGE_Z + FAR_EDGE_Z) / 2;
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

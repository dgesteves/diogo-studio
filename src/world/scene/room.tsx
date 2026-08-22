"use client";

import { type ReactElement } from "react";
import { Color } from "three";
import { CITY_WINDOW, ROOM } from "../room";

const SHELL_COLOR = new Color("#1b2630");

/**
 * The key light sits at [3,5,3], so only +x/+z-facing normals catch it: the back and
 * left walls render at roughly ambient + 0.53, while the front wall, right wall and
 * ceiling get ambient alone. With no GI to fill them in they read ~1.8x darker, so
 * their base color is pre-multiplied (in linear space) to land on the same value.
 */
const AMBIENT_ONLY_GAIN = 1.8;
const AMBIENT_ONLY_COLOR = SHELL_COLOR.clone().multiplyScalar(AMBIENT_ONLY_GAIN);

/**
 * Each wall is exactly the span it closes, floor to ceiling. Nothing here may overhang a
 * corner: the window is a hole in the left wall, so an oversized plane on any of the other
 * three hangs out into the city view as a slab suspended over the skyline.
 */
const CEILING_SIZE: [number, number] = [ROOM.width, ROOM.depth];
const CEILING_POSITION: [number, number, number] = [ROOM.centerX, ROOM.ceilingY, ROOM.centerZ];

type Wall = {
  key: string;
  size: [number, number];
  position: [number, number, number];
  rotationY: number;
  color: Color;
};
type Panel = { size: [number, number]; position: [number, number, number] };

const SOLID_WALLS: Wall[] = [
  {
    key: "back",
    size: [ROOM.width, ROOM.wallHeight],
    position: [ROOM.centerX, ROOM.wallCenterY, ROOM.minZ],
    rotationY: 0,
    color: SHELL_COLOR,
  },
  {
    key: "front",
    size: [ROOM.width, ROOM.wallHeight],
    position: [ROOM.centerX, ROOM.wallCenterY, ROOM.maxZ],
    rotationY: Math.PI,
    color: AMBIENT_ONLY_COLOR,
  },
  {
    key: "right",
    size: [ROOM.depth, ROOM.wallHeight],
    position: [ROOM.maxX, ROOM.wallCenterY, ROOM.centerZ],
    rotationY: -Math.PI / 2,
    color: AMBIENT_ONLY_COLOR,
  },
];

/**
 * The left wall, as the four panels the window leaves of it. The group it hangs in is turned a
 * quarter turn, so its local +x runs toward -z in the room and the opening is measured off the
 * wall's own center rather than the world's.
 */
function buildLeftWallPanels(): Panel[] {
  const halfW = ROOM.depth / 2;
  const halfH = ROOM.wallHeight / 2;
  const openX = ROOM.centerZ - CITY_WINDOW.centerZ;
  const openY = CITY_WINDOW.centerY - ROOM.wallCenterY;
  const left = openX - CITY_WINDOW.width / 2;
  const right = openX + CITY_WINDOW.width / 2;
  const bottom = openY - CITY_WINDOW.height / 2;
  const top = openY + CITY_WINDOW.height / 2;
  return [
    { size: [ROOM.depth, halfH - top], position: [0, (top + halfH) / 2, 0] },
    { size: [ROOM.depth, bottom + halfH], position: [0, (bottom - halfH) / 2, 0] },
    { size: [left + halfW, CITY_WINDOW.height], position: [(left - halfW) / 2, openY, 0] },
    { size: [halfW - right, CITY_WINDOW.height], position: [(right + halfW) / 2, openY, 0] },
  ];
}

const LEFT_WALL_PANELS = buildLeftWallPanels();

export function Room(): ReactElement {
  return (
    <group>
      {SOLID_WALLS.map((wall) => (
        <mesh
          key={wall.key}
          position={wall.position}
          rotation={[0, wall.rotationY, 0]}
          receiveShadow
        >
          <planeGeometry args={wall.size} />
          <meshStandardMaterial color={wall.color} roughness={1} metalness={0} />
        </mesh>
      ))}

      <group position={[ROOM.minX, ROOM.wallCenterY, ROOM.centerZ]} rotation={[0, Math.PI / 2, 0]}>
        {LEFT_WALL_PANELS.map((panel) => (
          <mesh
            key={`${panel.position.join(",")}:${panel.size.join(",")}`}
            position={panel.position}
            receiveShadow
          >
            <planeGeometry args={panel.size} />
            <meshStandardMaterial color={SHELL_COLOR} roughness={1} metalness={0} />
          </mesh>
        ))}
      </group>

      <mesh position={CEILING_POSITION} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={CEILING_SIZE} />
        <meshStandardMaterial color={AMBIENT_ONLY_COLOR} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

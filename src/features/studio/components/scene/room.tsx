"use client";

import { type ReactElement } from "react";
import { Color } from "three";
import { ROOM } from "@/constants/room";

import { CITY_WINDOW } from "./constants";

const SHELL_COLOR = new Color("#1b2630");

/**
 * The key light sits at [3,5,3], so only +x/+z-facing normals catch it: the back and
 * left walls render at roughly ambient + 0.53, while the front wall, right wall and
 * ceiling get ambient alone. With no GI to fill them in they read ~1.8x darker, so
 * their base color is pre-multiplied (in linear space) to land on the same value.
 */
const AMBIENT_ONLY_GAIN = 1.8;
const AMBIENT_ONLY_COLOR = SHELL_COLOR.clone().multiplyScalar(AMBIENT_ONLY_GAIN);

const WALL_SIZE: [number, number] = [ROOM.wallSpan, ROOM.wallHeight];
const CEILING_SIZE: [number, number] = [ROOM.maxX - ROOM.minX, ROOM.maxZ - ROOM.minZ];
const CEILING_POSITION: [number, number, number] = [
  (ROOM.minX + ROOM.maxX) / 2,
  ROOM.ceilingY,
  (ROOM.minZ + ROOM.maxZ) / 2,
];

type Wall = {
  key: string;
  position: [number, number, number];
  rotationY: number;
  color: Color;
};
type Panel = { size: [number, number]; position: [number, number, number] };

const SOLID_WALLS: Wall[] = [
  { key: "back", position: [0, ROOM.wallCenterY, ROOM.minZ], rotationY: 0, color: SHELL_COLOR },
  {
    key: "front",
    position: [0, ROOM.wallCenterY, ROOM.maxZ],
    rotationY: Math.PI,
    color: AMBIENT_ONLY_COLOR,
  },
  {
    key: "right",
    position: [ROOM.maxX, ROOM.wallCenterY, 0],
    rotationY: -Math.PI / 2,
    color: AMBIENT_ONLY_COLOR,
  },
];

function buildLeftWallPanels(): Panel[] {
  const halfW = ROOM.wallSpan / 2;
  const halfH = ROOM.wallHeight / 2;
  const openX = -CITY_WINDOW.centerZ;
  const openY = CITY_WINDOW.centerY - ROOM.wallCenterY;
  const left = openX - CITY_WINDOW.width / 2;
  const right = openX + CITY_WINDOW.width / 2;
  const bottom = openY - CITY_WINDOW.height / 2;
  const top = openY + CITY_WINDOW.height / 2;
  return [
    { size: [ROOM.wallSpan, halfH - top], position: [0, (top + halfH) / 2, 0] },
    { size: [ROOM.wallSpan, bottom + halfH], position: [0, (bottom - halfH) / 2, 0] },
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
          <planeGeometry args={WALL_SIZE} />
          <meshStandardMaterial color={wall.color} roughness={1} metalness={0} />
        </mesh>
      ))}

      <group position={[ROOM.minX, ROOM.wallCenterY, 0]} rotation={[0, Math.PI / 2, 0]}>
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

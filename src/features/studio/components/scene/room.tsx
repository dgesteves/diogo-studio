"use client";

import { type ReactElement } from "react";

import { CITY_WINDOW, LEFT_WALL } from "./constants";

const WALL_COLOR = "#1b2630";
const BACK_WALL_SIZE: [number, number] = [22, 10];
const BACK_WALL_Z = -2.3;
const BACK_WALL_CENTER_Y = 3;

type Panel = { size: [number, number]; position: [number, number, number] };

function buildLeftWallPanels(): Panel[] {
  const halfW = LEFT_WALL.width / 2;
  const halfH = LEFT_WALL.height / 2;
  const openX = -CITY_WINDOW.centerZ;
  const openY = CITY_WINDOW.centerY - LEFT_WALL.centerY;
  const left = openX - CITY_WINDOW.width / 2;
  const right = openX + CITY_WINDOW.width / 2;
  const bottom = openY - CITY_WINDOW.height / 2;
  const top = openY + CITY_WINDOW.height / 2;
  return [
    { size: [LEFT_WALL.width, halfH - top], position: [0, (top + halfH) / 2, 0] },
    { size: [LEFT_WALL.width, bottom + halfH], position: [0, (bottom - halfH) / 2, 0] },
    { size: [left + halfW, CITY_WINDOW.height], position: [(left - halfW) / 2, openY, 0] },
    { size: [halfW - right, CITY_WINDOW.height], position: [(right + halfW) / 2, openY, 0] },
  ];
}

const LEFT_WALL_PANELS = buildLeftWallPanels();

export function Room(): ReactElement {
  return (
    <group>
      <mesh position={[0, BACK_WALL_CENTER_Y, BACK_WALL_Z]} receiveShadow>
        <planeGeometry args={BACK_WALL_SIZE} />
        <meshStandardMaterial color={WALL_COLOR} roughness={1} metalness={0} />
      </mesh>
      <group position={[LEFT_WALL.x, LEFT_WALL.centerY, 0]} rotation={[0, Math.PI / 2, 0]}>
        {LEFT_WALL_PANELS.map((panel) => (
          <mesh
            key={`${panel.position.join(",")}:${panel.size.join(",")}`}
            position={panel.position}
            receiveShadow
          >
            <planeGeometry args={panel.size} />
            <meshStandardMaterial color={WALL_COLOR} roughness={1} metalness={0} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

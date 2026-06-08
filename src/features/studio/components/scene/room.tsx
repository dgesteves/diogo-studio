"use client";

import { type ReactElement } from "react";

const WALL_COLOR = "#1b2630";
const WALL_SIZE: [number, number] = [22, 10];
const WALL_OFFSET = 2.3;
const WALL_CENTER_Y = 3;

export function Room(): ReactElement {
  return (
    <group>
      <mesh position={[0, WALL_CENTER_Y, -WALL_OFFSET]} receiveShadow>
        <planeGeometry args={WALL_SIZE} />
        <meshStandardMaterial color={WALL_COLOR} roughness={1} metalness={0} />
      </mesh>
      <mesh
        position={[-WALL_OFFSET, WALL_CENTER_Y, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={WALL_SIZE} />
        <meshStandardMaterial color={WALL_COLOR} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

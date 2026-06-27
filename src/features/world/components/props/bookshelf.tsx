"use client";

import { type ReactElement } from "react";
import { Instance, Instances } from "@react-three/drei";

import type { Vec3 } from "../../types";
import { SHELF_BOOKS } from "./bookshelf-instances";
import { ShelfLight } from "./shelf-light";

const FRAME_COLOR = "#0c1116";
const SHELF_COLOR = "#161d24";
const PLANK_THICKNESS = 0.025;
const PLANK_YS = [0.5, 0.94, 1.38, 1.82];

const FRAME_PANELS: readonly { position: Vec3; args: Vec3 }[] = [
  { position: [-0.075, 1.15, 0], args: [0.03, 2.3, 1.1] },
  { position: [0.005, 1.15, -0.55], args: [0.2, 2.3, 0.04] },
  { position: [0.005, 1.15, 0.55], args: [0.2, 2.3, 0.04] },
  { position: [0.005, 2.28, 0], args: [0.2, 0.04, 1.1] },
  { position: [0.005, 0.04, 0], args: [0.2, 0.04, 1.1] },
];

export function Bookshelf(): ReactElement {
  return (
    <group position={[-2.18, 0, 3.7]}>
      <ShelfLight />
      {FRAME_PANELS.map((panel) => (
        <mesh key={panel.position.join(",")} position={panel.position}>
          <boxGeometry args={panel.args} />
          <meshStandardMaterial color={FRAME_COLOR} roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
      {PLANK_YS.map((y) => (
        <mesh key={y} position={[0.01, y, 0]}>
          <boxGeometry args={[0.16, PLANK_THICKNESS, 1.04]} />
          <meshStandardMaterial color={SHELF_COLOR} roughness={0.6} />
        </mesh>
      ))}
      <Instances limit={SHELF_BOOKS.length} range={SHELF_BOOKS.length} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.92} metalness={0} />
        {SHELF_BOOKS.map((book) => (
          <Instance
            key={book.key}
            position={book.position}
            scale={book.scale}
            rotation={book.rotation}
            color={book.color}
          />
        ))}
      </Instances>
    </group>
  );
}

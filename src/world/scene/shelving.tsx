"use client";

import { mulberry32 } from "../random";
import { useState, type ReactElement } from "react";
import { Object3D } from "three";
import { worldColors } from "../materials";
import { Instance, Instances } from "@react-three/drei";
import { type Vec3 } from "../stations";

/**
 * The bookshelf. Forty books are one instanced mesh rather than forty siblings — at this
 * count the draw calls are the whole cost — and their layout is seeded, so the same shelf
 * renders every time.
 */

export type ShelfBook = {
  z: number;
  height: number;
  thickness: number;
  depth: number;
  color: string;
  lean: number;
};

const SPINE_COLORS = [
  "#243440",
  "#2b3a46",
  "#22323a",
  "#31424c",
  "#3a4b53",
  "#26343f",
  "#2e3d45",
  "#3f505a",
  "#465862",
] as const;

const ACCENT_COLORS = ["#1d6a7c", "#2c5a74", "#7c3554", "#8f652f"] as const;
const ACCENT_CHANCE = 0.07;

const SHELF_HALF = 0.5;
const MARGIN = 0.02;
const GAP_CHANCE = 0.13;
const LEAN_CHANCE = 0.1;
const MIN_THICKNESS = 0.026;
const THICKNESS_RANGE = 0.05;
const MIN_HEIGHT = 0.2;
const HEIGHT_RANGE = 0.18;
const MIN_DEPTH = 0.11;
const DEPTH_RANGE = 0.045;
const BOOK_SPACING = 0.003;
const MAX_LEAN = 0.14;

export function buildShelfBooks(seed: number, maxHeight: number): ShelfBook[] {
  const random = mulberry32(seed);
  const books: ShelfBook[] = [];
  const fallback = SPINE_COLORS[0];
  const end = SHELF_HALF - MARGIN;
  let z = -SHELF_HALF + MARGIN;

  while (z < end) {
    if (random() < GAP_CHANCE) {
      z += 0.02 + random() * 0.04;
      continue;
    }
    const thickness = MIN_THICKNESS + random() * THICKNESS_RANGE;
    if (z + thickness > end) break;
    const height = Math.min(MIN_HEIGHT + random() * HEIGHT_RANGE, maxHeight);
    const depth = MIN_DEPTH + random() * DEPTH_RANGE;
    const pool = random() < ACCENT_CHANCE ? ACCENT_COLORS : SPINE_COLORS;
    const index = Math.floor(random() * pool.length);
    const color = pool[index] ?? fallback;
    const lean = random() < LEAN_CHANCE ? (random() - 0.5) * MAX_LEAN : 0;
    books.push({ z: z + thickness / 2, height, thickness, depth, color, lean });
    z += thickness + BOOK_SPACING;
  }

  return books;
}

type BookInstance = {
  key: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color: string;
};

const BOOK_FRONT_X = 0.085;

const ROWS = [
  { baseY: 0.06, maxHeight: 0.36, seed: 1337 },
  { baseY: 0.52, maxHeight: 0.34, seed: 5081 },
  { baseY: 0.96, maxHeight: 0.34, seed: 9043 },
  { baseY: 1.4, maxHeight: 0.34, seed: 2671 },
  { baseY: 1.84, maxHeight: 0.38, seed: 6217 },
] as const;

export const SHELF_BOOKS: BookInstance[] = ROWS.flatMap((row) =>
  buildShelfBooks(row.seed, row.maxHeight).map((book): BookInstance => ({
    key: `${row.seed}-${book.z.toFixed(3)}`,
    position: [BOOK_FRONT_X - book.depth / 2, row.baseY + book.height / 2, book.z],
    scale: [book.depth, book.height, book.thickness],
    rotation: [book.lean, 0, 0],
    color: book.color,
  })),
);

const HOUSING = { color: "#10151b", roughness: 0.5, metalness: 0.6 } as const;
const BAR_POS: [number, number, number] = [0.12, 2.34, 0];
const TARGET_POS: [number, number, number] = [0.03, 0.7, 0];
const STRIP_X = 0.092;
const STRIP_YS = [0.48, 0.92, 1.36, 1.8, 2.26] as const;

function ShelfLight(): ReactElement {
  const [target] = useState(() => new Object3D());

  return (
    <group>
      <mesh position={BAR_POS}>
        <boxGeometry args={[0.06, 0.028, 0.82]} />
        <meshStandardMaterial {...HOUSING} />
      </mesh>
      <mesh position={[BAR_POS[0], BAR_POS[1] - 0.018, BAR_POS[2]]}>
        <boxGeometry args={[0.04, 0.006, 0.78]} />
        <meshBasicMaterial color={worldColors.accentSoft} toneMapped={false} />
      </mesh>
      {STRIP_YS.map((y) => (
        <mesh key={y} position={[STRIP_X, y, 0]}>
          <boxGeometry args={[0.012, 0.006, 1.0]} />
          <meshBasicMaterial color={worldColors.accent} toneMapped={false} />
        </mesh>
      ))}
      <primitive object={target} position={TARGET_POS} />
      <spotLight
        position={BAR_POS}
        target={target}
        angle={0.95}
        penumbra={0.85}
        intensity={3}
        distance={4}
        decay={2}
        color={worldColors.coolLight}
      />
      <pointLight
        position={[0.5, 1.15, 0]}
        intensity={1.1}
        distance={2.6}
        decay={2}
        color={worldColors.accentSoft}
      />
    </group>
  );
}

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

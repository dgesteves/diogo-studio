"use client";

import { type ReactElement } from "react";
import { RoundedBox } from "@react-three/drei";

import type { Vec3 } from "../../types";
import { buildShelfBooks, type ShelfBook } from "./bookshelf-layout";
import { ShelfLight } from "./shelf-light";

const FRAME_COLOR = "#0c1116";
const SHELF_COLOR = "#161d24";
const PLANK_THICKNESS = 0.025;
const BOOK_FRONT_X = 0.085;

const FRAME_PANELS: readonly { position: Vec3; args: Vec3 }[] = [
  { position: [-0.075, 1.15, 0], args: [0.03, 2.3, 1.1] },
  { position: [0.005, 1.15, -0.55], args: [0.2, 2.3, 0.04] },
  { position: [0.005, 1.15, 0.55], args: [0.2, 2.3, 0.04] },
  { position: [0.005, 2.28, 0], args: [0.2, 0.04, 1.1] },
  { position: [0.005, 0.04, 0], args: [0.2, 0.04, 1.1] },
];

const ROWS = [
  { baseY: 0.06, maxHeight: 0.36, seed: 1337 },
  { baseY: 0.52, plankY: 0.5, maxHeight: 0.34, seed: 5081 },
  { baseY: 0.96, plankY: 0.94, maxHeight: 0.34, seed: 9043 },
  { baseY: 1.4, plankY: 1.38, maxHeight: 0.34, seed: 2671 },
  { baseY: 1.84, plankY: 1.82, maxHeight: 0.38, seed: 6217 },
] as const;

type ShelfRowProps = {
  baseY: number;
  maxHeight: number;
  seed: number;
  plankY?: number;
};

function Book({ book, baseY }: { book: ShelfBook; baseY: number }): ReactElement {
  const centerX = BOOK_FRONT_X - book.depth / 2;
  return (
    <RoundedBox
      args={[book.depth, book.height, book.thickness]}
      radius={0.006}
      smoothness={3}
      position={[centerX, baseY + book.height / 2, book.z]}
      rotation={[book.lean, 0, 0]}
    >
      <meshStandardMaterial color={book.color} roughness={0.92} metalness={0} />
    </RoundedBox>
  );
}

function ShelfRow({ baseY, maxHeight, seed, plankY }: ShelfRowProps): ReactElement {
  const books = buildShelfBooks(seed, maxHeight);
  return (
    <group>
      {plankY !== undefined ? (
        <mesh position={[0.01, plankY, 0]}>
          <boxGeometry args={[0.16, PLANK_THICKNESS, 1.04]} />
          <meshStandardMaterial color={SHELF_COLOR} roughness={0.6} />
        </mesh>
      ) : null}
      {books.map((book) => (
        <Book key={`${seed}-${book.z.toFixed(3)}`} book={book} baseY={baseY} />
      ))}
    </group>
  );
}

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
      {ROWS.map((row) => (
        <ShelfRow
          key={row.seed}
          baseY={row.baseY}
          maxHeight={row.maxHeight}
          seed={row.seed}
          plankY={"plankY" in row ? row.plankY : undefined}
        />
      ))}
    </group>
  );
}

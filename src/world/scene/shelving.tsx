"use client";

import { mulberry32 } from "../random";
import { Suspense, useState, type ReactElement } from "react";
import { Object3D, SRGBColorSpace } from "three";
import { anodizedMetalMaterial, frameMaterial, useWorldPalette, worldColors } from "../materials";
import { Instance, Instances, RoundedBox, useTexture } from "@react-three/drei";
import { NEON_RULE_Y, ROOM } from "../room";
import { type Vec3 } from "../stations";

/**
 * The shelving: the tall bookshelf beside the door, and the pair of floating shelves on the
 * wall the desk faces. Every book in both is one instanced mesh rather than a hundred
 * siblings — at this count the draw calls are the whole cost — and every row is laid out from
 * a seed, so the same shelf renders every time.
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

/** A row is laid out centered on zero along its own axis; `span` is how long that row is. */
const SHELF_SPAN = 1;
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

export function buildShelfBooks(seed: number, maxHeight: number, span = SHELF_SPAN): ShelfBook[] {
  const random = mulberry32(seed);
  const books: ShelfBook[] = [];
  const fallback = SPINE_COLORS[0];
  const half = span / 2;
  const end = half - MARGIN;
  let z = -half + MARGIN;

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
const SHELF_SURFACE = { color: "#161d24", roughness: 0.6 } as const;
const PAPER_ROUGHNESS = 0.92;
const PRINT_ROUGHNESS = 0.7;
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
          <meshStandardMaterial {...SHELF_SURFACE} />
        </mesh>
      ))}
      <Instances limit={SHELF_BOOKS.length} range={SHELF_BOOKS.length} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={PAPER_ROUGHNESS} metalness={0} />
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

/**
 * The two floating shelves on the wall the desk faces. They are staggered rather than stacked:
 * the only clear wall there is the band between the monitors' top edge and the neon rule, and
 * that band is not two rows of books deep.
 *
 * Each row of spines is `buildShelfBooks` turned a quarter turn — the generator lays a row out
 * along one axis, which is z for the bookshelf and x here, so a spine's thickness scales x and
 * its lean rotates about z. How tall a row may grow is not authored: it is whatever the shelf's
 * height leaves under the neon rule, so raising a shelf shortens its books instead of running
 * them through the tube.
 */

type WallShelfLayout = {
  key: string;
  centerX: number;
  /** The plank's mid-height. */
  y: number;
  width: number;
  /** The row of spines: where it starts, measured from the shelf's left end, and how long. */
  bookOffset: number;
  bookSpan: number;
  bookSeed: number;
};

const WALL_SHELF_THICKNESS = 0.045;
const WALL_SHELF_DEPTH = 0.24;
/** Back edge flush with the shell, so the plank reads as fixed to it. */
const WALL_SHELF_Z = ROOM.minZ + WALL_SHELF_DEPTH / 2;
/** Spines stand in front of the neon tube's own standoff, so no book can ever cross it in z. */
const WALL_SHELF_BOOK_Z = ROOM.minZ + 0.045;
const NEON_RULE_CLEARANCE = 0.07;

const LOWER_SHELF: WallShelfLayout = {
  key: "lower",
  centerX: -0.82,
  y: 1.32,
  width: 1.62,
  bookOffset: 0.06,
  bookSpan: 0.86,
  bookSeed: 4211,
};

const UPPER_SHELF: WallShelfLayout = {
  key: "upper",
  centerX: 0.78,
  y: 1.5,
  width: 1.26,
  bookOffset: 0.5,
  bookSpan: 0.7,
  bookSeed: 8317,
};

export const WALL_SHELVES: readonly WallShelfLayout[] = [LOWER_SHELF, UPPER_SHELF];

/** The plank's top surface, where everything standing on the shelf sits. */
export function shelfTop(shelf: WallShelfLayout): number {
  return shelf.y + WALL_SHELF_THICKNESS / 2;
}

/** How tall a book on this shelf may be before it reaches the rule under the sign. */
export function shelfBookCeiling(shelf: WallShelfLayout): number {
  return NEON_RULE_Y - NEON_RULE_CLEARANCE - shelfTop(shelf);
}

/** A position on top of the plank, `offsetX` from the shelf's center. */
function onShelf(shelf: WallShelfLayout, offsetX: number): Vec3 {
  return [shelf.centerX + offsetX, shelfTop(shelf), WALL_SHELF_Z];
}

export const WALL_SHELF_BOOKS: BookInstance[] = WALL_SHELVES.flatMap((shelf) => {
  const rowCenter = shelf.bookOffset + shelf.bookSpan / 2 - shelf.width / 2;

  return buildShelfBooks(shelf.bookSeed, shelfBookCeiling(shelf), shelf.bookSpan).map(
    (book): BookInstance => ({
      key: `${shelf.key}-${book.z.toFixed(3)}`,
      position: [
        shelf.centerX + rowCenter + book.z,
        shelfTop(shelf) + book.height / 2,
        WALL_SHELF_BOOK_Z + book.depth / 2,
      ],
      scale: [book.thickness, book.height, book.depth],
      rotation: [0, 0, book.lean],
      color: book.color,
    }),
  );
});

/** Books left lying flat, which is what keeps a shelf from reading as a wall of spines. */
const STACK_SLABS: readonly { color: string; args: Vec3; y: number; rotationY: number }[] = [
  { color: SPINE_COLORS[1], args: [0.19, 0.032, 0.145], y: 0.016, rotationY: 0.07 },
  { color: ACCENT_COLORS[0], args: [0.175, 0.026, 0.135], y: 0.045, rotationY: -0.11 },
  { color: SPINE_COLORS[5], args: [0.165, 0.028, 0.128], y: 0.072, rotationY: 0.03 },
];

function BookStack({ shelf, offsetX }: { shelf: WallShelfLayout; offsetX: number }): ReactElement {
  return (
    <group position={onShelf(shelf, offsetX)}>
      {STACK_SLABS.map((slab) => (
        <mesh key={slab.color} position={[0, slab.y, 0]} rotation={[0, slab.rotationY, 0]}>
          <boxGeometry args={slab.args} />
          <meshStandardMaterial color={slab.color} roughness={PAPER_ROUGHNESS} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The photograph in the frame on the lower shelf, and the only image file the scene loads —
 * everything else it draws is geometry or a canvas texture. Two things follow from that and
 * both are silent when wrong: `TextureLoader` leaves `colorSpace` at `NoColorSpace`, which
 * renders a photograph washed out, and the print's proportions come from the asset rather
 * than from the frame, or a face arrives stretched. `PRINT_ASPECT` is that asset's, and
 * `shelving.test.ts` reads the file to hold the two together.
 */
export const PRINT_TEXTURE = "/images/shelf-print.jpg";
export const PRINT_ASPECT = 3 / 4;

const PRINT_IMAGE_HEIGHT = 0.4;
const PRINT_IMAGE_WIDTH = PRINT_IMAGE_HEIGHT * PRINT_ASPECT;
/** The molding's face width and how far it stands proud of the picture it holds. */
const PRINT_RAIL = 0.026;
const PRINT_DEPTH = 0.026;
const PRINT_BACKING = 0.008;
const PRINT_SIZE: Vec3 = [
  PRINT_IMAGE_WIDTH + PRINT_RAIL * 2,
  PRINT_IMAGE_HEIGHT + PRINT_RAIL * 2,
  PRINT_DEPTH,
];
/** Leaned back against the wall, the way a print rests rather than hangs. */
const PRINT_LEAN = -0.13;

/**
 * Four rails around the picture rather than one panel behind it. A slab reads as a dark
 * rectangle from every angle; a molding standing proud of the picture catches the key light
 * on its top and inner edges, which is the whole of what makes a frame look like one.
 */
const PRINT_RAILS: readonly {
  key: string;
  position: Vec3;
  args: [number, number, number];
}[] = [
  {
    key: "top",
    position: [0, (PRINT_IMAGE_HEIGHT + PRINT_RAIL) / 2, 0],
    args: [PRINT_SIZE[0], PRINT_RAIL, PRINT_DEPTH],
  },
  {
    key: "bottom",
    position: [0, -(PRINT_IMAGE_HEIGHT + PRINT_RAIL) / 2, 0],
    args: [PRINT_SIZE[0], PRINT_RAIL, PRINT_DEPTH],
  },
  {
    key: "left",
    position: [-(PRINT_IMAGE_WIDTH + PRINT_RAIL) / 2, 0, 0],
    args: [PRINT_RAIL, PRINT_IMAGE_HEIGHT, PRINT_DEPTH],
  },
  {
    key: "right",
    position: [(PRINT_IMAGE_WIDTH + PRINT_RAIL) / 2, 0, 0],
    args: [PRINT_RAIL, PRINT_IMAGE_HEIGHT, PRINT_DEPTH],
  },
];

function LeaningPrint({
  shelf,
  offsetX,
}: {
  shelf: WallShelfLayout;
  offsetX: number;
}): ReactElement {
  const photograph = useTexture(PRINT_TEXTURE);
  const palette = useWorldPalette();

  return (
    <group position={onShelf(shelf, offsetX)} rotation={[PRINT_LEAN, 0, 0]}>
      <group position={[0, PRINT_SIZE[1] / 2, PRINT_DEPTH]}>
        <mesh position={[0, 0, -(PRINT_DEPTH + PRINT_BACKING) / 2]}>
          <boxGeometry args={[PRINT_SIZE[0], PRINT_SIZE[1], PRINT_BACKING]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>

        <mesh>
          <planeGeometry args={[PRINT_IMAGE_WIDTH, PRINT_IMAGE_HEIGHT]} />
          <meshStandardMaterial
            map={photograph}
            map-colorSpace={SRGBColorSpace}
            color={palette.printTint}
            roughness={PRINT_ROUGHNESS}
            metalness={0}
          />
        </mesh>

        {PRINT_RAILS.map((rail) => (
          <RoundedBox
            key={rail.key}
            args={rail.args}
            radius={0.004}
            smoothness={2}
            position={rail.position}
          >
            <meshStandardMaterial {...anodizedMetalMaterial} />
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}

const POT_HEIGHT = 0.07;
const FOLIAGE: readonly { position: Vec3; radius: number }[] = [
  { position: [0, POT_HEIGHT + 0.045, 0], radius: 0.052 },
  { position: [-0.038, POT_HEIGHT + 0.024, 0.016], radius: 0.038 },
  { position: [0.036, POT_HEIGHT + 0.03, -0.014], radius: 0.034 },
];

function ShelfPlant({ shelf, offsetX }: { shelf: WallShelfLayout; offsetX: number }): ReactElement {
  return (
    <group position={onShelf(shelf, offsetX)}>
      <mesh position={[0, POT_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.046, 0.034, POT_HEIGHT, 18]} />
        <meshStandardMaterial {...SHELF_SURFACE} />
      </mesh>
      {FOLIAGE.map((clump) => (
        <mesh key={clump.radius} position={clump.position}>
          <icosahedronGeometry args={[clump.radius, 0]} />
          <meshStandardMaterial color={worldColors.foliage} roughness={0.6} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** A hairline under the front lip: the shelves have to read as objects in an unlit corner. */
const LIP_INSET = 0.012;

function WallShelfPlank({ shelf }: { shelf: WallShelfLayout }): ReactElement {
  return (
    <group position={[shelf.centerX, shelf.y, WALL_SHELF_Z]}>
      <mesh>
        <boxGeometry args={[shelf.width, WALL_SHELF_THICKNESS, WALL_SHELF_DEPTH]} />
        <meshStandardMaterial {...SHELF_SURFACE} />
      </mesh>
      <mesh position={[0, -WALL_SHELF_THICKNESS / 2 - 0.01, -0.03]}>
        <boxGeometry args={[shelf.width - 0.16, 0.02, WALL_SHELF_DEPTH - 0.09]} />
        <meshStandardMaterial {...HOUSING} />
      </mesh>
      <mesh position={[0, -WALL_SHELF_THICKNESS / 2 - 0.003, WALL_SHELF_DEPTH / 2 - LIP_INSET]}>
        <boxGeometry args={[shelf.width - 0.06, 0.006, 0.006]} />
        <meshBasicMaterial color={worldColors.accentSoft} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function WallShelves(): ReactElement {
  return (
    <group>
      {WALL_SHELVES.map((shelf) => (
        <WallShelfPlank key={shelf.key} shelf={shelf} />
      ))}

      <Suspense fallback={null}>
        <LeaningPrint shelf={LOWER_SHELF} offsetX={0.42} />
      </Suspense>
      <ShelfPlant shelf={LOWER_SHELF} offsetX={0.68} />
      <BookStack shelf={UPPER_SHELF} offsetX={-0.42} />

      <Instances
        limit={WALL_SHELF_BOOKS.length}
        range={WALL_SHELF_BOOKS.length}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={PAPER_ROUGHNESS} metalness={0} />
        {WALL_SHELF_BOOKS.map((book) => (
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

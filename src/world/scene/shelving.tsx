"use client";

import { mulberry32 } from "../random";
import { Suspense, useState, type ReactElement } from "react";
import { Object3D, SRGBColorSpace } from "three";
import { anodizedMetalMaterial, frameMaterial, useWorldPalette, worldColors } from "../materials";
import { Instance, Instances, RoundedBox, useTexture } from "@react-three/drei";
import { ROOM, SHELF_BAND_TOP_Y } from "../room";
import { type Vec3 } from "../stations";
import { bookDesign, Books, type BookDesign, type BookPlacement } from "./books";
import { Pothos } from "./plant";
import { Starship, SuperHeavy } from "./starship";
import { Vader } from "./vader";

/**
 * The shelving: the tall bookshelf beside the door, and the three floating shelves on the
 * wall the desk faces. Every book in both is one merged mesh rather than a hundred siblings —
 * at this count the draw calls are the whole cost — and every row is laid out from a seed, so
 * the same shelf renders every time.
 *
 * What a spine is *made of* is `books.tsx`; this file decides only how many stand where.
 */

export type ShelfBook = {
  z: number;
  height: number;
  thickness: number;
  depth: number;
  design: BookDesign;
  lean: number;
};

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
    const lean = random() < LEAN_CHANCE ? (random() - 0.5) * MAX_LEAN : 0;
    // Stepped from the seed and the position in the row rather than drawn, so the binding
    // and the title are the one thing a row is guaranteed not to repeat back to back.
    const design = bookDesign(seed + books.length);
    books.push({ z: z + thickness / 2, height, thickness, depth, design, lean });
    z += thickness + BOOK_SPACING;
  }

  return books;
}

const BOOK_FRONT_X = 0.085;

const ROWS = [
  { baseY: 0.06, maxHeight: 0.36, seed: 1337 },
  { baseY: 0.52, maxHeight: 0.34, seed: 5081 },
  { baseY: 0.96, maxHeight: 0.34, seed: 9043 },
  { baseY: 1.4, maxHeight: 0.34, seed: 2671 },
  { baseY: 1.84, maxHeight: 0.38, seed: 6217 },
] as const;

/** Spines out along +x, so the row is read from the middle of the room. */
const BOOKSHELF_POSE = { kind: "upright", spine: "px" } as const;

export const SHELF_BOOKS: BookPlacement[] = ROWS.flatMap((row) =>
  buildShelfBooks(row.seed, row.maxHeight).map((book): BookPlacement => ({
    key: `${row.seed}-${book.z.toFixed(3)}`,
    position: [BOOK_FRONT_X - book.depth / 2, row.baseY + book.height / 2, book.z],
    size: [book.depth, book.height, book.thickness],
    rotation: [book.lean, 0, 0],
    pose: BOOKSHELF_POSE,
    design: book.design,
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
      <Books books={SHELF_BOOKS} />
    </group>
  );
}

/**
 * The three floating shelves on the wall the desk faces. They climb the band between the desk
 * and the sign in three lanes — middle, left, right — so no two sit over the same stretch of
 * wall at the same height and the wall reads as a wall rather than as a rack.
 *
 * Each row of spines is `buildShelfBooks` turned a quarter turn — the generator lays a row out
 * along one axis, which is z for the bookshelf and x here, so a spine's thickness scales x and
 * its lean rotates about z. How tall a row may grow is not authored: it is whatever the shelf
 * has clear above it, so raising a shelf, or hanging one over it, shortens its books instead
 * of running them through what is there.
 */

type WallShelfBooks = {
  /** Where the row starts, measured from the shelf's left end, and how long it runs. */
  offset: number;
  span: number;
  seed: number;
};

type WallShelfLayout = {
  key: string;
  centerX: number;
  /** The plank's mid-height. */
  y: number;
  width: number;
  books: WallShelfBooks;
};

const WALL_SHELF_THICKNESS = 0.045;
export const WALL_SHELF_DEPTH = 0.24;
/** Back edge flush with the shell, so the plank reads as fixed to it. */
const WALL_SHELF_Z = ROOM.minZ + WALL_SHELF_DEPTH / 2;
/** Spines stand in front of the neon tube's own standoff, so no book can ever cross it in z. */
const WALL_SHELF_BOOK_Z = ROOM.minZ + 0.045;
/** Air left over a row of spines, so a book never quite touches what hangs above it. */
const SHELF_CLEARANCE = 0.07;

const BOTTOM_SHELF: WallShelfLayout = {
  key: "bottom",
  centerX: 0.1,
  y: 1.18,
  width: 1.8,
  books: { offset: 0.15, span: 0.8, seed: 6473 },
};

const MIDDLE_SHELF: WallShelfLayout = {
  key: "middle",
  centerX: -0.85,
  y: 1.52,
  width: 1.7,
  books: { offset: 0.06, span: 0.86, seed: 4211 },
};

const TOP_SHELF: WallShelfLayout = {
  key: "top",
  centerX: 1,
  y: 1.78,
  width: 1.6,
  // `offset` is measured from the left end, so widening a shelf rightward leaves its row of
  // spines where it already was.
  books: { offset: 0.55, span: 0.7, seed: 8317 },
};

export const WALL_SHELVES: readonly WallShelfLayout[] = [BOTTOM_SHELF, MIDDLE_SHELF, TOP_SHELF];

/** The plank's top surface, where everything standing on the shelf sits. */
export function shelfTop(shelf: WallShelfLayout): number {
  return shelf.y + WALL_SHELF_THICKNESS / 2;
}

function overlapsInX(a: WallShelfLayout, b: WallShelfLayout): boolean {
  return Math.abs(a.centerX - b.centerX) < (a.width + b.width) / 2;
}

/**
 * What hangs over this shelf: the sign's band, or the underside of a plank above it that its
 * books would otherwise grow through. Derived rather than authored, so hanging a new shelf
 * over an old one shortens the old one's row instead of needing it re-tuned by hand.
 */
export function shelfCeilingY(shelf: WallShelfLayout): number {
  const overhead = WALL_SHELVES.filter(
    (other) => other.y > shelf.y && overlapsInX(other, shelf),
  ).map((other) => other.y - WALL_SHELF_THICKNESS / 2);

  return Math.min(SHELF_BAND_TOP_Y, ...overhead);
}

/**
 * How much clear height one spot on a shelf has. `shelfCeilingY` is the whole plank's worst
 * case, which is what a row of books spanning it has to respect; a single ornament stands at
 * one x and is only bounded by what actually hangs over that x.
 */
export function clearanceAbove(shelf: WallShelfLayout, offsetX: number): number {
  const x = shelf.centerX + offsetX;
  const overhead = WALL_SHELVES.filter(
    (other) => other.y > shelf.y && Math.abs(other.centerX - x) < other.width / 2,
  ).map((other) => other.y - WALL_SHELF_THICKNESS / 2);

  return Math.min(SHELF_BAND_TOP_Y, ...overhead) - shelfTop(shelf) - SHELF_CLEARANCE;
}

/** How tall a book on this shelf may be before it reaches whatever is above it. */
export function shelfBookCeiling(shelf: WallShelfLayout): number {
  return shelfCeilingY(shelf) - SHELF_CLEARANCE - shelfTop(shelf);
}

/** A position on top of the plank, `offsetX` from the shelf's center. */
function onShelf(shelf: WallShelfLayout, offsetX: number): Vec3 {
  return [shelf.centerX + offsetX, shelfTop(shelf), WALL_SHELF_Z];
}

/** Spines out along +z, the quarter turn from the bookshelf's that the row itself is. */
const WALL_SHELF_POSE = { kind: "upright", spine: "pz" } as const;

export const WALL_SHELF_BOOKS: BookPlacement[] = WALL_SHELVES.flatMap((shelf) => {
  const row = shelf.books;
  const rowCenter = row.offset + row.span / 2 - shelf.width / 2;

  return buildShelfBooks(row.seed, shelfBookCeiling(shelf), row.span).map(
    (book): BookPlacement => ({
      key: `${shelf.key}-${book.z.toFixed(3)}`,
      position: [
        shelf.centerX + rowCenter + book.z,
        shelfTop(shelf) + book.height / 2,
        WALL_SHELF_BOOK_Z + book.depth / 2,
      ],
      size: [book.thickness, book.height, book.depth],
      rotation: [0, 0, book.lean],
      pose: WALL_SHELF_POSE,
      design: book.design,
    }),
  );
});

/**
 * The puzzle cube on the bottom shelf, solved and turned off-axis so three faces catch the
 * light. Its 54 stickers are one instanced mesh: at this size they are nine tiles a face, and
 * as sibling meshes they would cost more draw calls than the rest of the shelving put together.
 */
export const PUZZLE_SIZE = 0.11;
const PUZZLE_STEP = PUZZLE_SIZE / 3;
const PUZZLE_TILE = PUZZLE_STEP - 0.005;
const PUZZLE_STICKER_DEPTH = 0.003;
/** How far a sticker's own slab stands proud of the body it is stuck to. */
const PUZZLE_STICKER_LIFT = 0.0012;
const PUZZLE_YAW = 0.7;
const PUZZLE_BODY = { color: "#080b0e", roughness: 0.42, metalness: 0.05 } as const;
const PUZZLE_STICKER_ROUGHNESS = 0.3;

/**
 * A face is a color plus the frame it is laid out in: the axis it faces along, and the two
 * axes its 3×3 grid runs across. Deriving the grid from that basis is what keeps a sticker
 * on the surface of the cube rather than inside it.
 */
type PuzzleFace = {
  key: string;
  color: string;
  normal: Vec3;
  across: Vec3;
  down: Vec3;
  rotation: Vec3;
};

const PUZZLE_FACES: readonly PuzzleFace[] = [
  {
    key: "up",
    color: "#d5dbe0",
    normal: [0, 1, 0],
    across: [1, 0, 0],
    down: [0, 0, 1],
    rotation: [-Math.PI / 2, 0, 0],
  },
  {
    key: "down",
    color: "#dcb23f",
    normal: [0, -1, 0],
    across: [1, 0, 0],
    down: [0, 0, 1],
    rotation: [Math.PI / 2, 0, 0],
  },
  {
    key: "front",
    color: "#b23a3d",
    normal: [0, 0, 1],
    across: [1, 0, 0],
    down: [0, 1, 0],
    rotation: [0, 0, 0],
  },
  {
    key: "back",
    color: "#c4672b",
    normal: [0, 0, -1],
    across: [1, 0, 0],
    down: [0, 1, 0],
    rotation: [0, Math.PI, 0],
  },
  {
    key: "right",
    color: "#2f6cae",
    normal: [1, 0, 0],
    across: [0, 0, 1],
    down: [0, 1, 0],
    rotation: [0, Math.PI / 2, 0],
  },
  {
    key: "left",
    color: "#3c8f56",
    normal: [-1, 0, 0],
    across: [0, 0, 1],
    down: [0, 1, 0],
    rotation: [0, -Math.PI / 2, 0],
  },
];

const PUZZLE_CELLS: readonly (readonly [number, number])[] = [-1, 0, 1].flatMap((across) =>
  [-1, 0, 1].map((down) => [across, down] as const),
);

export type PuzzleSticker = {
  key: string;
  position: Vec3;
  rotation: Vec3;
  color: string;
};

function stickerPosition(face: PuzzleFace, across: number, down: number): Vec3 {
  const lift = PUZZLE_SIZE / 2 + PUZZLE_STICKER_LIFT;
  const along = (axis: 0 | 1 | 2): number =>
    face.normal[axis] * lift +
    face.across[axis] * across * PUZZLE_STEP +
    face.down[axis] * down * PUZZLE_STEP;

  return [along(0), along(1), along(2)];
}

export const PUZZLE_STICKERS: readonly PuzzleSticker[] = PUZZLE_FACES.flatMap((face) =>
  PUZZLE_CELLS.map(([across, down]): PuzzleSticker => ({
    key: `${face.key}-${across}-${down}`,
    position: stickerPosition(face, across, down),
    rotation: face.rotation,
    color: face.color,
  })),
);

function PuzzleCube({ shelf, offsetX }: { shelf: WallShelfLayout; offsetX: number }): ReactElement {
  const [x, y, z] = onShelf(shelf, offsetX);

  return (
    <group position={[x, y + PUZZLE_SIZE / 2, z]} rotation={[0, PUZZLE_YAW, 0]}>
      <RoundedBox args={[PUZZLE_SIZE, PUZZLE_SIZE, PUZZLE_SIZE]} radius={0.006} smoothness={2}>
        <meshStandardMaterial {...PUZZLE_BODY} />
      </RoundedBox>
      {/* Culled on the base tile's bounds, not the instances', so a camera tilt drops all 54
          stickers at once and leaves the bare body. */}
      <Instances
        limit={PUZZLE_STICKERS.length}
        range={PUZZLE_STICKERS.length}
        frustumCulled={false}
      >
        <boxGeometry args={[PUZZLE_TILE, PUZZLE_TILE, PUZZLE_STICKER_DEPTH]} />
        <meshStandardMaterial roughness={PUZZLE_STICKER_ROUGHNESS} metalness={0} />
        {PUZZLE_STICKERS.map((sticker) => (
          <Instance
            key={sticker.key}
            position={sticker.position}
            rotation={sticker.rotation}
            color={sticker.color}
          />
        ))}
      </Instances>
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

/**
 * Where the two rocket models stand: the one stretch of this shelf with nothing overhead but
 * the top plank, which is what lets them be twice the height of the books beside them.
 */
export const BOOSTER_OFFSET_X = 0.16;
export const SHIP_OFFSET_X = 0.34;

/** Where the figure stands on the top shelf. */
export const VADER_OFFSET_X = -0.5;

/**
 * The pothos hangs off the near end of the middle shelf. What bounds it is the bottom plank,
 * which passes under this spot: the vines have to stop short of that height, and
 * `plant.test.ts` is what holds them to it.
 */
export const POTHOS_ANCHOR: Vec3 = onShelf(MIDDLE_SHELF, 0.72);

/** A tube under the front lip: the shelves have to read as objects in an unlit corner. */
const LIP_INSET = 0.012;
const LIP_STRIP = 0.01;

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
      <mesh
        position={[0, -WALL_SHELF_THICKNESS / 2 - LIP_STRIP / 2, WALL_SHELF_DEPTH / 2 - LIP_INSET]}
      >
        <boxGeometry args={[shelf.width - 0.06, LIP_STRIP, LIP_STRIP]} />
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
        <LeaningPrint shelf={MIDDLE_SHELF} offsetX={0.34} />
      </Suspense>
      <Pothos position={POTHOS_ANCHOR} />
      <Vader position={onShelf(TOP_SHELF, VADER_OFFSET_X)} />
      <SuperHeavy position={onShelf(BOTTOM_SHELF, BOOSTER_OFFSET_X)} />
      <Starship position={onShelf(BOTTOM_SHELF, SHIP_OFFSET_X)} />
      <PuzzleCube shelf={BOTTOM_SHELF} offsetX={0.7} />

      <Books books={WALL_SHELF_BOOKS} />
    </group>
  );
}

export type ShelfBook = {
  z: number;
  height: number;
  thickness: number;
  depth: number;
  color: string;
  lean: number;
};

const SPINE_COLORS = [
  "#18282f",
  "#1b2630",
  "#172430",
  "#1d2c2c",
  "#202b32",
  "#16272d",
  "#1e2a30",
  "#252f36",
  "#2a3a3e",
] as const;

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

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
    const index = Math.floor(random() * SPINE_COLORS.length);
    const color = SPINE_COLORS[index] ?? fallback;
    const lean = random() < LEAN_CHANCE ? (random() - 0.5) * MAX_LEAN : 0;
    books.push({ z: z + thickness / 2, height, thickness, depth, color, lean });
    z += thickness + BOOK_SPACING;
  }

  return books;
}

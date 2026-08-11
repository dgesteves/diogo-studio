import { describe, expect, it } from "vitest";

import { SHELF_BOOKS } from "./bookshelf-instances";
import { buildShelfBooks, type ShelfBook } from "./bookshelf-layout";

/**
 * The books on the shelf behind the desk. They are generated from a seed rather than
 * authored, so no type checks any of what a visitor actually sees: a bad draw can hang a
 * book off the end of the shelf, overlap it with its neighbor, or run it through the plank
 * above. `bookshelf-instances.ts` freezes one draw at module load and renders it instanced,
 * so these invariants are what make that draw shippable — and the seeded PRNG is what makes
 * them assertable at all.
 */

// The shelf `buildShelfBooks` fills is one unit wide with a 0.02 margin at each end.
const LEFT = -0.48;
const RIGHT = 0.48;
const SPACING = 0.003;

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
];
const ACCENT_COLORS = ["#1d6a7c", "#2c5a74", "#7c3554", "#8f652f"];

const start = (book: ShelfBook): number => book.z - book.thickness / 2;
const end = (book: ShelfBook): number => book.z + book.thickness / 2;

describe("buildShelfBooks", () => {
  const books = buildShelfBooks(1337, 0.36);

  it("fills the shelf without pushing a book past either end", () => {
    expect(books.length).toBeGreaterThan(8);
    for (const book of books) {
      expect
        .soft(start(book), `book at ${book.z} starts before the shelf`)
        .toBeGreaterThanOrEqual(LEFT);
      expect.soft(end(book), `book at ${book.z} runs past the shelf`).toBeLessThanOrEqual(RIGHT);
    }
  });

  it("never overlaps two spines, and leaves a real gap here and there", () => {
    const gaps = books.slice(1).map((book, index) => start(book) - end(books[index]!));

    for (const gap of gaps) expect.soft(gap).toBeGreaterThanOrEqual(SPACING - 1e-9);
    // Without the gap branch the row is one unbroken block of spines, which reads as a
    // texture rather than as books.
    expect(gaps.filter((gap) => gap > SPACING + 0.01).length).toBeGreaterThan(0);
  });

  it("keeps every spine within its declared size range and palette", () => {
    for (const book of books) {
      expect.soft(book.thickness).toBeGreaterThanOrEqual(0.026);
      expect.soft(book.thickness).toBeLessThanOrEqual(0.076);
      expect.soft(book.depth).toBeGreaterThanOrEqual(0.11);
      expect.soft(book.depth).toBeLessThanOrEqual(0.155);
      expect.soft([...SPINE_COLORS, ...ACCENT_COLORS]).toContain(book.color);
    }
    // Accents are the 7% case. A pool picked the wrong way round would still pass every
    // assertion above.
    expect(books.filter((book) => ACCENT_COLORS.includes(book.color)).length).toBeLessThan(
      books.length / 2,
    );
    expect(books.filter((book) => SPINE_COLORS.includes(book.color)).length).toBeGreaterThan(0);
  });

  it("leans a few books and stands the rest upright", () => {
    const leaning = books.filter((book) => book.lean !== 0);

    expect(leaning.length).toBeGreaterThan(0);
    expect(leaning.length).toBeLessThan(books.length / 2);
    for (const book of leaning) expect.soft(Math.abs(book.lean)).toBeLessThanOrEqual(0.07);
  });

  it("clamps a book to the height it is given rather than through the shelf above", () => {
    const short = buildShelfBooks(1337, 0.24);

    expect(Math.max(...short.map((book) => book.height))).toBeLessThanOrEqual(0.24);
    // The clamp changes heights only — the same seed still lays the same spines out.
    expect(short.map((book) => book.z)).toEqual(books.map((book) => book.z));
    expect(Math.max(...books.map((book) => book.height))).toBeGreaterThan(0.24);
  });

  it("draws the same shelf every time, and a different one per seed", () => {
    expect(buildShelfBooks(1337, 0.36)).toEqual(books);
    expect(buildShelfBooks(5081, 0.36)).not.toEqual(books);
  });
});

describe("SHELF_BOOKS", () => {
  const ROWS = [
    { baseY: 0.06, maxHeight: 0.36, seed: 1337 },
    { baseY: 0.52, maxHeight: 0.34, seed: 5081 },
    { baseY: 0.96, maxHeight: 0.34, seed: 9043 },
    { baseY: 1.4, maxHeight: 0.34, seed: 2671 },
    { baseY: 1.84, maxHeight: 0.38, seed: 6217 },
  ];

  it("gives every instance a key React can tell apart", () => {
    expect(new Set(SHELF_BOOKS.map((book) => book.key)).size).toBe(SHELF_BOOKS.length);
  });

  it("stands each book on its own shelf at the size the generator gave it", () => {
    let offset = 0;

    for (const row of ROWS) {
      const books = buildShelfBooks(row.seed, row.maxHeight);
      const instances = SHELF_BOOKS.slice(offset, offset + books.length);
      offset += books.length;

      for (const [index, book] of books.entries()) {
        const instance = instances[index]!;
        // A cube scaled to the spine, sitting on the plank rather than half inside it.
        expect.soft(instance.scale).toEqual([book.depth, book.height, book.thickness]);
        expect.soft(instance.position[1]).toBeCloseTo(row.baseY + book.height / 2, 10);
        expect.soft(instance.position[2]).toBe(book.z);
        expect.soft(instance.rotation).toEqual([book.lean, 0, 0]);
        expect.soft(instance.color).toBe(book.color);
      }
    }

    expect(offset).toBe(SHELF_BOOKS.length);
  });

  it("keeps every row clear of the one above it", () => {
    for (const [index, row] of ROWS.slice(0, -1).entries()) {
      const tallest = Math.max(...buildShelfBooks(row.seed, row.maxHeight).map((b) => b.height));
      expect
        .soft(row.baseY + tallest, `row ${index} runs into the next shelf`)
        .toBeLessThan(ROWS[index + 1]!.baseY);
    }
  });

  it("gives each shelf its own arrangement", () => {
    const rows = ROWS.map((row) =>
      buildShelfBooks(row.seed, row.maxHeight)
        .map((book) => book.z.toFixed(4))
        .join(),
    );

    expect(new Set(rows).size).toBe(ROWS.length);
  });
});

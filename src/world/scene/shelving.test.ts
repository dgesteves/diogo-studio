import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { DESK_TOP_Y, ROOM, SHELF_BAND_TOP_Y } from "../room";
import { BOOK_CLOTHS } from "./books";
import {
  buildShelfBooks,
  SHELF_BOOKS,
  PRINT_ASPECT,
  PRINT_TEXTURE,
  PUZZLE_SIZE,
  PUZZLE_STICKERS,
  shelfBookCeiling,
  shelfCeilingY,
  shelfTop,
  WALL_SHELF_BOOKS,
  WALL_SHELVES,
  type ShelfBook,
} from "./shelving";

/**
 * The books on the shelf behind the desk. They are generated from a seed rather than
 * authored, so no type checks any of what a visitor actually sees: a bad draw can hang a
 * book off the end of the shelf, overlap it with its neighbor, or run it through the plank
 * above. `SHELF_BOOKS` freezes one draw at module load and `books.tsx` merges it into a single
 * mesh, so these invariants are what make that draw shippable — and the seeded PRNG is what
 * makes them assertable at all.
 */

// The shelf `buildShelfBooks` fills is one unit wide with a 0.02 margin at each end.
const LEFT = -0.48;
const RIGHT = 0.48;
const SPACING = 0.003;

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
      expect.soft(BOOK_CLOTHS).toContain(book.design.cloth);
    }
  });

  /**
   * The one thing a shelf of generated books gives itself away with, and the reason the
   * design is stepped rather than drawn: two neighbors in the same cloth under the same
   * title read as one book rendered twice, and every range assertion above still passes.
   */
  it("never binds or titles two neighbors alike", () => {
    for (const [index, book] of books.slice(1).entries()) {
      const before = books[index]!;
      expect
        .soft(book.design.cloth.key, `two ${book.design.cloth.key} spines meet`)
        .not.toBe(before.design.cloth.key);
      expect.soft(book.design.title.join(" ")).not.toBe(before.design.title.join(" "));
    }
    // And the row spends the palette rather than leaving it to the law of averages.
    expect(new Set(books.map((book) => book.design.cloth.key)).size).toBeGreaterThan(5);
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
        // A box the size of the spine, sitting on the plank rather than half inside it.
        expect.soft(instance.size).toEqual([book.depth, book.height, book.thickness]);
        expect.soft(instance.position[1]).toBeCloseTo(row.baseY + book.height / 2, 10);
        expect.soft(instance.position[2]).toBe(book.z);
        expect.soft(instance.rotation).toEqual([book.lean, 0, 0]);
        expect.soft(instance.design).toEqual(book.design);
        // Spine out into the room, so the row is read rather than seen edge on.
        expect.soft(instance.pose).toEqual({ kind: "upright", spine: "px" });
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

/**
 * The floating shelves on the wall the desk faces. The band they hang in is bounded above by
 * the sign and below by the monitors, and both bounds are invisible to every other check
 * here: a taller row of books, a shelf nudged up, or a new plank hung over an old one runs
 * spines straight through something and nothing fails. These are those bounds.
 */
describe("WALL_SHELVES", () => {
  const overlapInX = (a: (typeof WALL_SHELVES)[number], b: typeof a): boolean =>
    Math.abs(a.centerX - b.centerX) < (a.width + b.width) / 2;

  const pairs = WALL_SHELVES.flatMap((shelf, index) =>
    WALL_SHELVES.slice(index + 1).map((other) => [shelf, other] as const),
  );

  it("hangs every shelf in the band the sign leaves, inside the shell", () => {
    expect(WALL_SHELVES).toHaveLength(3);

    for (const shelf of WALL_SHELVES) {
      expect.soft(shelf.y, `${shelf.key} hangs below the desk`).toBeGreaterThan(DESK_TOP_Y);
      expect.soft(shelf.y, `${shelf.key} hangs into the sign`).toBeLessThan(SHELF_BAND_TOP_Y);
      // The back wall is 22 units of plane and the room is 7.7 of it: a shelf laid out from
      // the wall rather than from the room runs straight out through the side of the shell.
      expect.soft(shelf.centerX - shelf.width / 2).toBeGreaterThan(ROOM.minX);
      expect.soft(shelf.centerX + shelf.width / 2).toBeLessThan(ROOM.maxX);
    }
  });

  /**
   * Stacking is allowed — the lanes overlap, so a plank does hang over another — but two of
   * them sharing a stretch of wall have to be far enough apart in y to be two shelves with a
   * row of books between them rather than one thick one.
   */
  it("never runs two planks into each other", () => {
    for (const [a, b] of pairs) {
      if (!overlapInX(a, b)) continue;
      expect
        .soft(Math.abs(a.y - b.y), `${a.key} and ${b.key} sit on top of each other`)
        .toBeGreaterThan(0.3);
    }
  });

  /** Three shelves hung at the same x would read as a rack rather than as three shelves. */
  it("puts each shelf in its own lane", () => {
    const centers = WALL_SHELVES.map((shelf) => shelf.centerX);

    expect(new Set(centers).size).toBe(WALL_SHELVES.length);
    for (const [a, b] of pairs) {
      expect
        .soft(Math.abs(a.centerX - b.centerX), `${a.key} and ${b.key} share a lane`)
        .toBeGreaterThan(0.5);
    }
  });

  it("keeps a row of spines on the plank it stands on", () => {
    for (const shelf of WALL_SHELVES) {
      const books = shelf.books;
      const half = shelf.width / 2;
      expect.soft(books.offset).toBeGreaterThanOrEqual(0);
      expect.soft(books.offset + books.span).toBeLessThanOrEqual(shelf.width);

      const row = buildShelfBooks(books.seed, shelfBookCeiling(shelf), books.span);
      const center = books.offset + books.span / 2 - half;
      expect(row.length).toBeGreaterThan(3);
      for (const book of row) {
        const x = center + book.z;
        expect.soft(x - book.thickness / 2, `${shelf.key} spills left`).toBeGreaterThan(-half);
        expect.soft(x + book.thickness / 2, `${shelf.key} spills right`).toBeLessThan(half);
      }
    }
  });

  /**
   * The one thing the shelves' height is derived from rather than authored. Every spine's top
   * has to land under whatever hangs over it — the sign's band, or the plank above — so
   * raising a shelf or hanging a new one over it has to shorten the row, and a row given a
   * free hand would reach 0.38.
   */
  it("stops every spine short of what hangs over its shelf", () => {
    expect(WALL_SHELF_BOOKS.length).toBeGreaterThan(WALL_SHELVES.length * 3);

    for (const book of WALL_SHELF_BOOKS) {
      const top = book.position[1] + book.size[1] / 2;
      const shelf = WALL_SHELVES.find(
        (candidate) => Math.abs(shelfTop(candidate) - (book.position[1] - book.size[1] / 2)) < 1e-9,
      );
      expect
        .soft(top, `a spine at x=${book.position[0]} reaches what is above it`)
        .toBeLessThan(shelfCeilingY(shelf!));
    }
  });

  /**
   * A shelf may declare a row it has no height for: the generator clamps every spine to the
   * ceiling it is given, so a squashed row renders as a line of slivers rather than failing.
   */
  it("leaves every shelf the height for the row it declares", () => {
    for (const shelf of WALL_SHELVES) {
      expect
        .soft(shelfBookCeiling(shelf), `${shelf.key} has no room for its books`)
        .toBeGreaterThanOrEqual(0.2);
    }
  });

  it("stands each spine on a shelf, turned a quarter turn from the bookshelf's", () => {
    const tops = WALL_SHELVES.map(shelfTop);

    for (const book of WALL_SHELF_BOOKS) {
      // Thickness across x and depth into z: the row runs along the wall, not out of it.
      expect.soft(book.size[0]).toBeLessThan(book.size[2]);
      // A lean tilts the spine along the row; about x it would tip into the wall instead.
      expect.soft(book.rotation[0]).toBe(0);
      expect.soft(book.rotation[1]).toBe(0);
      // The spine faces the room across the desk, a quarter turn from the bookshelf's.
      expect.soft(book.pose).toEqual({ kind: "upright", spine: "pz" });
      // Standing on a plank, not sunk half into one or hovering over it.
      const bottom = book.position[1] - book.size[1] / 2;
      expect
        .soft(
          tops.some((top) => Math.abs(top - bottom) < 1e-9),
          `a spine floats at y=${bottom}`,
        )
        .toBe(true);
    }
  });

  it("gives every instance a key React can tell apart, across both shelves", () => {
    expect(new Set(WALL_SHELF_BOOKS.map((book) => book.key)).size).toBe(WALL_SHELF_BOOKS.length);
  });
});

/**
 * The print's asset. `PRINT_ASPECT` is a number typed next to a filename, and the frame's
 * geometry is built from it — swap the photograph for a landscape one and the face renders
 * stretched with nothing failing. The file is also fetched into the scene at runtime rather
 * than through `next/image`, so its weight is a payload the room pays on load: the original
 * camera JPEG this was cut down from is 1.6 MB.
 */
describe("the print's asset", () => {
  const file = new URL(`../../../public${PRINT_TEXTURE}`, import.meta.url);
  const bytes = readFileSync(file);

  /** JPEG dimensions live in the frame header, which is the first SOFn segment. */
  function jpegSize(jpeg: Buffer): { width: number; height: number } {
    let offset = 2;
    while (offset + 9 < jpeg.length) {
      if (jpeg[offset] !== 0xff) throw new Error(`not a segment at ${offset}`);
      const marker = jpeg[offset + 1]!;
      const isFrameHeader =
        marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrameHeader) {
        return { height: jpeg.readUInt16BE(offset + 5), width: jpeg.readUInt16BE(offset + 7) };
      }
      offset += 2 + jpeg.readUInt16BE(offset + 2);
    }
    throw new Error("no frame header");
  }

  it("is shaped the way the frame is built for", () => {
    const { width, height } = jpegSize(bytes);

    expect(width / height).toBeCloseTo(PRINT_ASPECT, 2);
  });

  it("stays a decoration-sized download", () => {
    expect(bytes.byteLength).toBeLessThan(150_000);
  });
});

/**
 * The puzzle cube on the bottom shelf. Its stickers are placed from each face's basis rather
 * than typed out, so one wrong axis buries nine of them inside the body — which renders as a
 * cube with a blank side and fails nothing.
 */
describe("PUZZLE_STICKERS", () => {
  const HALF = PUZZLE_SIZE / 2;

  it("covers all six faces, nine tiles each", () => {
    expect(PUZZLE_STICKERS).toHaveLength(54);
    expect(new Set(PUZZLE_STICKERS.map((sticker) => sticker.key)).size).toBe(54);

    const perColor = new Map<string, number>();
    for (const sticker of PUZZLE_STICKERS) {
      perColor.set(sticker.color, (perColor.get(sticker.color) ?? 0) + 1);
    }
    expect(perColor.size).toBe(6);
    for (const count of perColor.values()) expect(count).toBe(9);
  });

  it("lays every sticker on the surface of the cube, not inside it", () => {
    for (const sticker of PUZZLE_STICKERS) {
      const distances = sticker.position.map(Math.abs);
      // Exactly one axis is the face's own, standing just proud of it; the other two are the
      // grid, which stays inside the cube's footprint.
      expect
        .soft(
          distances.filter((d) => d > HALF),
          `${sticker.key} is not on one face`,
        )
        .toHaveLength(1);
      for (const distance of distances) expect.soft(distance).toBeLessThan(HALF + 0.01);
    }
  });

  it("gives each face its own outward color", () => {
    const byNormal = new Map<string, Set<string>>();

    for (const sticker of PUZZLE_STICKERS) {
      const axis = sticker.position.findIndex((value) => Math.abs(value) > HALF);
      const face = `${axis}:${Math.sign(sticker.position[axis]!)}`;
      byNormal.set(face, (byNormal.get(face) ?? new Set()).add(sticker.color));
    }

    expect(byNormal.size).toBe(6);
    for (const colors of byNormal.values()) expect(colors.size).toBe(1);
  });
});

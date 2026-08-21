import { describe, expect, it } from "vitest";

import {
  bookAtlasLayout,
  bookCellRects,
  BOOK_CELL,
  STACKED_CELL,
  coverFaceSize,
  BOOK_CLOTHS,
  BOOK_PIXELS_PER_METER,
  bookDesign,
  createBookGeometry,
  facePrint,
  faceUV,
  pageGrain,
  spineFaceSize,
  type BookPlacement,
  type BookPose,
  type FaceKey,
} from "./books";
import { SHELF_BOOKS, WALL_SHELF_BOOKS } from "./shelving";

/**
 * How a book is bound and how it is built. Neither is checked by anything a visitor can see
 * going wrong in a way that fails: art painted outside its own cell prints a neighbor's foil
 * on a cover, a UV off by a cell letters the wrong title, and a face wound the wrong way
 * renders as a hole in a shelf. All three look like "the shelf is a bit odd" and none of them
 * throws, so they are asserted from the numbers instead.
 */

const FACES: readonly FaceKey[] = ["px", "nx", "py", "ny", "pz", "nz"];

/** Every book the room actually contains, which is what the fit assertions have to hold for. */
const ROOM_BOOKS = [...SHELF_BOOKS, ...WALL_SHELF_BOOKS];

function place(size: [number, number, number], pose: BookPose): BookPlacement {
  return {
    key: "test",
    position: [0, 0, 0],
    size,
    rotation: [0, 0, 0],
    pose,
    design: bookDesign(0),
  };
}

/** A row of shelved books, for the assertions that only care how many there are. */
function shelved(count: number): BookPlacement[] {
  return Array.from({ length: count }, () =>
    place([0.13, 0.3, 0.04], { kind: "upright", spine: "px" }),
  );
}

/** The coffee table's, restated rather than imported: `lounge.tsx` is a client module. */
const STACKED_BOOK = place([0.24, 0.028, 0.32], { kind: "flat", spine: "nx" });

describe("bookDesign", () => {
  const designs = Array.from({ length: 200 }, (_, order) => bookDesign(order));

  it("never binds or titles two consecutive books alike", () => {
    for (const [index, design] of designs.slice(1).entries()) {
      const before = designs[index]!;
      expect.soft(design.cloth.key).not.toBe(before.cloth.key);
      expect.soft(design.title.join(" ")).not.toBe(before.title.join(" "));
    }
  });

  it("binds every book in a cloth the palette contains, and spends the whole palette", () => {
    for (const design of designs) expect.soft(BOOK_CLOTHS).toContain(design.cloth);
    expect(new Set(designs.map((design) => design.cloth.key)).size).toBe(BOOK_CLOTHS.length);
  });

  /**
   * A title is broken into the lines it prints as, and a spine cannot rewrap one: a line
   * nobody split lands on the shelf set at four pixels, which is a smudge rather than a book.
   */
  it("keeps every title line short enough to letter", () => {
    for (const design of designs) {
      expect.soft(design.title.length).toBeGreaterThan(0);
      expect.soft(design.title.length).toBeLessThanOrEqual(3);
      for (const line of design.title) {
        expect.soft(line.length, `"${line}" is too long for a spine`).toBeLessThanOrEqual(14);
        expect.soft(line.trim()).toBe(line);
      }
    }
  });

  it("gives the same order the same book every time", () => {
    expect(bookDesign(37)).toEqual(bookDesign(37));
    expect(bookDesign(37)).not.toEqual(bookDesign(38));
  });
});

describe("bookAtlasLayout", () => {
  it("holds every cell it is asked for, without a row of waste", () => {
    for (const count of [1, 3, 16, 17, 38, 83, 121]) {
      const books = shelved(count);
      const layout = bookAtlasLayout(books);
      expect.soft(layout.columns * layout.rows, `${count} books`).toBeGreaterThanOrEqual(count);
      expect.soft((layout.rows - 1) * layout.columns).toBeLessThan(count);
      expect.soft(layout.width).toBe(layout.columns * layout.cell.width);
      expect.soft(layout.height).toBe(layout.rows * layout.cell.height);
    }
  });

  /** A single book must still get a canvas, or a one-book shelf renders untextured. */
  it("never returns an empty canvas", () => {
    for (const count of [0, 1]) {
      const layout = bookAtlasLayout(shelved(count));
      expect.soft(layout.width).toBeGreaterThan(0);
      expect.soft(layout.height).toBeGreaterThan(0);
    }
  });

  /**
   * A stacked book needs a cell big enough for a cover, and the shelves cannot be given one:
   * 121 spines at that size is an atlas nobody should download. So the cell is a property of
   * the canvas, and one stacked book in it moves every cell up — which is only affordable
   * because no atlas in the room mixes poses.
   */
  it("sizes the cell for the pose the books are in", () => {
    expect(bookAtlasLayout(shelved(8)).cell).toBe(BOOK_CELL);
    expect(bookAtlasLayout([...shelved(2), STACKED_BOOK]).cell).toBe(STACKED_CELL);
    expect(STACKED_CELL.width).toBeGreaterThan(BOOK_CELL.width);
  });
});

describe("bookCellRects", () => {
  const layout = bookAtlasLayout(ROOM_BOOKS);

  /**
   * The one thing that silently ruins a shelf: the covers take their color from a patch of
   * cloth the spine art is supposed to stay clear of, so a spine grown past its zone prints
   * a foil rule on the sides of the book next to it.
   */
  it("keeps all three prints inside the book's own cell, and clear of each other", () => {
    for (const [index, book] of ROOM_BOOKS.entries()) {
      const rects = bookCellRects(index, layout, book);
      const left = (index % layout.columns) * layout.cell.width;
      const top = Math.floor(index / layout.columns) * layout.cell.height;

      for (const [print, rect] of Object.entries(rects)) {
        expect.soft(rect.x, `${print} spills left`).toBeGreaterThanOrEqual(left);
        expect.soft(rect.y, `${print} spills up`).toBeGreaterThanOrEqual(top);
        expect
          .soft(rect.x + rect.width, `${print} spills right`)
          .toBeLessThanOrEqual(left + layout.cell.width);
        expect
          .soft(rect.y + rect.height, `${print} spills down`)
          .toBeLessThanOrEqual(top + layout.cell.height);
        expect.soft(rect.width).toBeGreaterThan(0);
        expect.soft(rect.height).toBeGreaterThan(0);
      }

      expect.soft(rects.pages.y + rects.pages.height).toBeLessThanOrEqual(rects.cover.y);
      expect.soft(rects.cover.y + rects.cover.height).toBeLessThanOrEqual(rects.spine.y);
    }
  });

  /**
   * A stacked book's cell runs the other way round — cover, block, spine — because the cover
   * is the face it actually shows. The same thing has to hold of it: three zones that never
   * reach each other, in a cell that holds all three.
   */
  it("keeps a stacked book's three prints inside its cell, and clear of each other", () => {
    const stackedLayout = bookAtlasLayout([STACKED_BOOK]);
    const rects = bookCellRects(0, stackedLayout, STACKED_BOOK);

    for (const [print, rect] of Object.entries(rects)) {
      expect.soft(rect.x, `${print} spills left`).toBeGreaterThanOrEqual(0);
      expect.soft(rect.y, `${print} spills up`).toBeGreaterThanOrEqual(0);
      expect
        .soft(rect.x + rect.width, `${print} spills right`)
        .toBeLessThanOrEqual(stackedLayout.cell.width);
      expect
        .soft(rect.y + rect.height, `${print} spills down`)
        .toBeLessThanOrEqual(stackedLayout.cell.height);
    }

    expect.soft(rects.cover.y + rects.cover.height).toBeLessThanOrEqual(rects.pages.y);
    expect.soft(rects.pages.y + rects.pages.height).toBeLessThanOrEqual(rects.spine.y);
  });

  /**
   * The whole reason a stacked book gets its own cell: painted into a shelf cell the cover
   * came out at a quarter of the room's pixels-per-meter, which is a seven-pixel title
   * smeared over twenty centimeters of board.
   */
  it("draws a stacked cover at the same pixels-per-meter as a spine, in proportion", () => {
    const layout = bookAtlasLayout([STACKED_BOOK]);
    const { cover, spine } = bookCellRects(0, layout, STACKED_BOOK);
    const face = coverFaceSize(STACKED_BOOK.size);

    expect(cover.width).toBe(Math.round(face.width * BOOK_PIXELS_PER_METER));
    expect(cover.height).toBe(Math.round(face.height * BOOK_PIXELS_PER_METER));
    // The board and the spine beside it are the same book, so they are the same height.
    expect(cover.height).toBe(spine.height);
  });

  /** Portrait, so a cover is never lettered sideways relative to its own spine. */
  it("reads a cover as the shorter and longer extents of the book's footprint", () => {
    expect(coverFaceSize([0.24, 0.028, 0.32])).toEqual({ width: 0.24, height: 0.32 });
    expect(coverFaceSize([0.32, 0.028, 0.24])).toEqual({ width: 0.24, height: 0.32 });
  });

  /**
   * The cell is sized for the largest spine `buildShelfBooks` can produce — thickest and
   * tallest at once, which no shelf currently holds. Without the headroom the biggest book on
   * a shelf is the first one whose foil prints on its neighbors' covers, and only that book.
   */
  it("leaves room for the largest book the generator can draw", () => {
    // The upper end of the ranges `shelving.test.ts` holds `buildShelfBooks` to.
    const largest = place([0.155, 0.38, 0.076], { kind: "upright", spine: "px" });
    const rects = bookCellRects(0, layout, largest);

    expect(rects.spine.y).toBeGreaterThan(rects.cover.y + rects.cover.height);
    expect(rects.spine.x + rects.spine.width).toBeLessThanOrEqual(layout.cell.width);
    // And it is drawn at true scale rather than clamped down to fit.
    expect(rects.spine.height).toBe(Math.round(0.38 * BOOK_PIXELS_PER_METER));
    expect(rects.spine.width).toBe(Math.round(0.076 * BOOK_PIXELS_PER_METER));
  });

  /**
   * Every spine in the room is drawn at the same pixels-per-meter, so a thick book is a wide
   * spine rather than the same art stretched — which is what stops the lettering on a thin
   * one from being squeezed into a column of ink.
   */
  it("sizes a spine from the book rather than from the cell", () => {
    const thin = bookCellRects(
      0,
      layout,
      place([0.13, 0.2, 0.03], { kind: "upright", spine: "px" }),
    );
    const fat = bookCellRects(
      0,
      layout,
      place([0.13, 0.36, 0.07], { kind: "upright", spine: "px" }),
    );

    expect(fat.spine.width).toBeGreaterThan(thin.spine.width);
    expect(fat.spine.height).toBeGreaterThan(thin.spine.height);
    // Both stand on the foot of their cell, so a short book is short rather than floating.
    expect(fat.spine.y + fat.spine.height).toBe(thin.spine.y + thin.spine.height);
  });
});

describe("a book's faces", () => {
  it("prints the spine out, the pages up and the covers on the rest of a shelved book", () => {
    const pose: BookPose = { kind: "upright", spine: "pz" };
    const prints = FACES.map((face) => facePrint(pose, face));

    expect(prints.filter((print) => print === "spine")).toHaveLength(1);
    expect(facePrint(pose, "pz")).toBe("spine");
    expect(facePrint(pose, "py")).toBe("pages");
    expect(prints.filter((print) => print === "cover")).toHaveLength(4);
  });

  /**
   * Lying down, a book shows three cut edges and only its covers are cloth — the inverse of
   * a shelved one, and the reason the pose decides this rather than the call site.
   */
  it("prints three page edges and two covers on a stacked book", () => {
    const pose: BookPose = { kind: "flat", spine: "nx" };
    const prints = FACES.map((face) => facePrint(pose, face));

    expect(facePrint(pose, "nx")).toBe("spine");
    expect(prints.filter((print) => print === "pages")).toHaveLength(3);
    expect(facePrint(pose, "py")).toBe("cover");
    expect(facePrint(pose, "ny")).toBe("cover");
  });

  it("reads a spine as the shorter and longer extents of the face it is on", () => {
    expect(spineFaceSize([0.13, 0.3, 0.04], { kind: "upright", spine: "px" })).toEqual({
      thickness: 0.04,
      height: 0.3,
    });
    expect(spineFaceSize([0.24, 0.028, 0.32], { kind: "flat", spine: "nx" })).toEqual({
      thickness: 0.028,
      height: 0.32,
    });
  });

  /** Page edges lie across the thickness, and which image axis that is comes from the pose. */
  it("runs the page grain across the book's thickness in every pose", () => {
    expect(pageGrain({ kind: "upright", spine: "px" })).toBe("horizontal");
    expect(pageGrain({ kind: "upright", spine: "pz" })).toBe("vertical");
    expect(pageGrain({ kind: "flat", spine: "nx" })).toBe("horizontal");
  });
});

describe("faceUV", () => {
  const layout = bookAtlasLayout(shelved(16));
  const rect = { x: 0, y: 0, width: layout.cell.width, height: layout.cell.height };

  it("puts the image's top edge at the higher v, because canvas y runs the other way", () => {
    const [, v0, , , , v2] = faceUV(rect, layout, false);

    // The rect starts at the top of the canvas, so it reaches v = 1 and stops short of 0.
    expect(v2).toBe(1);
    expect(v0).toBeLessThan(1);
  });

  it("turns the art a quarter of the way round without leaving the rect", () => {
    const straight = faceUV(rect, layout, false);
    const turned = faceUV(rect, layout, true);

    expect(new Set(turned)).toEqual(new Set(straight));
    expect(turned).not.toEqual(straight);
  });
});

describe("createBookGeometry", () => {
  const geometry = createBookGeometry(SHELF_BOOKS);
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  const normals = geometry.getAttribute("normal");

  it("builds one box per book, wound as six quads", () => {
    expect(positions.count).toBe(SHELF_BOOKS.length * 24);
    expect(geometry.getIndex()?.count).toBe(SHELF_BOOKS.length * 36);
    expect(uvs.count).toBe(positions.count);
    expect(normals.count).toBe(positions.count);
  });

  it("bakes the placement in, so the merged mesh needs no transform of its own", () => {
    const book = place([0.2, 0.3, 0.05], { kind: "upright", spine: "px" });
    const upright = createBookGeometry([{ ...book, position: [1, 2, 3] }]).getAttribute("position");
    const xs: number[] = [];
    const ys: number[] = [];
    for (let vertex = 0; vertex < upright.count; vertex += 1) {
      xs.push(upright.getX(vertex));
      ys.push(upright.getY(vertex));
    }

    expect(Math.min(...xs)).toBeCloseTo(0.9);
    expect(Math.max(...xs)).toBeCloseTo(1.1);
    expect(Math.min(...ys)).toBeCloseTo(1.85);
    expect(Math.max(...ys)).toBeCloseTo(2.15);
  });

  it("leans a book by turning it rather than by moving its top", () => {
    const book = place([0.2, 0.3, 0.05], { kind: "upright", spine: "px" });
    const straight = createBookGeometry([book]).getAttribute("position");
    const leaning = createBookGeometry([{ ...book, rotation: [0.14, 0, 0] }]).getAttribute(
      "position",
    );

    const spread = (attribute: typeof straight): number => {
      let low = Infinity;
      let high = -Infinity;
      for (let vertex = 0; vertex < attribute.count; vertex += 1) {
        low = Math.min(low, attribute.getZ(vertex));
        high = Math.max(high, attribute.getZ(vertex));
      }
      return high - low;
    };

    // Turning the box widens its footprint along the row; sliding it would not.
    expect(spread(leaning)).toBeGreaterThan(spread(straight));
  });

  /**
   * The whole point of merging rather than instancing: each book reads its own cell. A UV
   * that strays into the next one letters a spine with its neighbor's title, which renders
   * perfectly and is wrong on every shelf.
   */
  it("keeps every book's UVs inside that book's own cell", () => {
    const layout = bookAtlasLayout(SHELF_BOOKS);

    for (let vertex = 0; vertex < uvs.count; vertex += 1) {
      const index = Math.floor(vertex / 24);
      const left = (index % layout.columns) * layout.cell.width;
      const top = Math.floor(index / layout.columns) * layout.cell.height;
      const x = uvs.getX(vertex) * layout.width;
      const y = (1 - uvs.getY(vertex)) * layout.height;

      expect.soft(x, `book ${index} samples another cell`).toBeGreaterThanOrEqual(left - 1e-6);
      expect.soft(x).toBeLessThanOrEqual(left + layout.cell.width + 1e-6);
      expect.soft(y).toBeGreaterThanOrEqual(top - 1e-6);
      expect.soft(y).toBeLessThanOrEqual(top + layout.cell.height + 1e-6);
    }
  });

  it("gives every face a unit normal pointing out of the box", () => {
    const book = place([0.2, 0.3, 0.05], { kind: "upright", spine: "px" });
    const built = createBookGeometry([book]);
    const face = built.getAttribute("normal");
    const seen = new Set<string>();

    for (let vertex = 0; vertex < face.count; vertex += 1) {
      const [x, y, z] = [face.getX(vertex), face.getY(vertex), face.getZ(vertex)];
      expect.soft(Math.hypot(x, y, z)).toBeCloseTo(1);
      seen.add([x, y, z].map((value) => Math.round(value)).join(","));
    }

    expect(seen.size).toBe(6);
  });
});

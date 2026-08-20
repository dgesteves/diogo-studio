"use client";

import { type ReactElement } from "react";
import {
  BufferGeometry,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Vector3,
  type CanvasTexture,
} from "three";
import { useDisposable } from "../gpu";
import { mulberry32 } from "../random";
import { createCanvasTexture } from "../screens/texture";
import type { Vec3 } from "../stations";

/**
 * What every book in the room is made of: a cloth, an ink, a title, a publisher's mark and
 * the page
 * block you see over the top of it. A book used to be a colored box, which reads as a color
 * block on a shelf however many of them stand side by side — the shelves are a station's
 * subject, not background, so the spines are painted rather than tinted.
 *
 * Two things carry that without costing the room a draw call per book.
 *
 * **One atlas, one cell per book.** Each book is painted into its own cell of a canvas
 * texture, so no two spines on a shelf are the same object. The hexes below are pigments a
 * routine paints with, not surface tokens: `world/materials.ts` owns what a *material* is
 * made of, and a palette a canvas mixes lives with the routine that mixes it, as the city's
 * lit windows and the moon's do.
 *
 * **One mesh per shelving unit.** Per-cell art means per-book UVs, which an `InstancedMesh`
 * cannot carry — every instance shares one geometry. So the boxes are merged into a single
 * geometry with the placement baked in, which is a draw call per unit rather than per book,
 * and one fewer than instancing costs. Nothing here animates, so nothing is given up for it.
 */

/**
 * A catalog with a guaranteed first entry, so the fallback when a stride lands out of range
 * is a real book rather than a non-null assertion.
 */
type Catalog<T> = readonly [T, ...T[]];

/**
 * A binding is three colors: the cloth, the ink it is printed in, and the band blocked
 * across the head of the spine — a modern publisher's, not a gilder's.
 *
 * The palette is the room's, not a library's. Warm cloth and gold leaf are what a shelf of
 * antiquarian bindings is made of, and the room has no warm surface in it and no light but
 * cyan: 121 gold-blocked spines read as somebody else's furniture moved into this studio.
 * Cool cloth and near-white ink read as what these titles actually are, which is a working
 * engineer's shelf. Two spines carry the room's own accents so the shelf belongs to it.
 */
export type BookCloth = {
  key: string;
  cloth: string;
  ink: string;
  band: string;
};

export const BOOK_CLOTHS: Catalog<BookCloth> = [
  { key: "petrol", cloth: "#1c4a56", ink: "#dff1f7", band: "#2f7d90" },
  { key: "graphite", cloth: "#272e35", ink: "#dbe6ec", band: "#4a5560" },
  { key: "indigo", cloth: "#22304e", ink: "#dbe4f2", band: "#3c5488" },
  { key: "carbon", cloth: "#13171c", ink: "#d6e2e8", band: "#343d45" },
  { key: "sea", cloth: "#1c4d46", ink: "#dcf0ea", band: "#2e8074" },
  { key: "slate", cloth: "#39434d", ink: "#e2eaef", band: "#616f7c" },
  { key: "bone", cloth: "#c2cbd0", ink: "#1b2126", band: "#6f7d85" },
  { key: "aubergine", cloth: "#38293f", ink: "#ecdff0", band: "#63466f" },
  { key: "moss", cloth: "#2b4034", ink: "#dcecdf", band: "#4a6b56" },
  { key: "signal", cloth: "#12667a", ink: "#e9fbff", band: "#2bb3cf" },
  { key: "ash", cloth: "#93a0a8", ink: "#161b20", band: "#4d5960" },
  { key: "ember", cloth: "#6d2c4c", ink: "#fbe4ef", band: "#b0507d" },
];

/**
 * The paper the block is cut from, and the shadow a cover casts over its own page edges.
 * One paper for every book: a shelf of differently-toned page blocks reads as a shelf of
 * differently-aged paper, which is a thing books do, but not one worth a parameter. It is a
 * cool white rather than cream for the same reason the ink is — nothing in this room is warm.
 */
const PAGE_PAPER = "#ced5d9";
const PAGE_LINE = "rgba(88, 102, 110, 0.36)";
const PAGE_SHADE = "rgba(14, 20, 24, 0.3)";

/** The spine's own shading: an edge-dark, center-light wash that reads as a rounded back. */
const SPINE_SHADE: readonly (readonly [number, string])[] = [
  [0, "rgba(0, 0, 0, 0.5)"],
  [0.16, "rgba(0, 0, 0, 0.14)"],
  [0.42, "rgba(255, 255, 255, 0.09)"],
  [0.74, "rgba(0, 0, 0, 0.12)"],
  [1, "rgba(0, 0, 0, 0.55)"],
];
const CLOTH_GRAIN = "rgba(0, 0, 0, 0.07)";
const HEAD_CAP = "rgba(0, 0, 0, 0.3)";

/**
 * What the spines say. Titles are decoration rather than content — nothing links to them and
 * the agent does not index them — so they live with the routine that prints them, the way
 * the keycap legends do.
 *
 * Each is already broken into the lines it prints as, because a spine is too narrow to wrap
 * one: a line that does not fit is set smaller, never rewrapped.
 */
const BOOK_TITLES: Catalog<readonly string[]> = [
  ["Real-Time", "Rendering"],
  ["Physically", "Based", "Rendering"],
  ["Computer", "Graphics"],
  ["3D Math", "Primer"],
  ["The Book of", "Shaders"],
  ["WebGL", "Insights"],
  ["Graphics", "Programming"],
  ["Ray Tracing", "in a Weekend"],
  ["Three.js", "Essentials"],
  ["Shaders", "Cookbook"],
  ["Game Engine", "Architecture"],
  ["Linear", "Algebra"],
  ["Color and", "Light"],
  ["The Visual", "Display"],
  ["Refactoring"],
  ["Design", "Patterns"],
  ["The Pragmatic", "Programmer"],
  ["Working", "Effectively", "with Legacy"],
  ["Domain-Driven", "Design"],
  ["Release It"],
  ["Accelerate"],
  ["The Mythical", "Man-Month"],
  ["Peopleware"],
  ["Thinking in", "Systems"],
  ["The Design of", "Everyday", "Things"],
  ["Don't Make", "Me Think"],
  ["Inclusive", "Components"],
  ["Form Design", "Patterns"],
  ["Atomic", "Design"],
  ["Grid Systems"],
  ["Typographic", "Style"],
  ["Interaction", "of Color"],
  ["High", "Performance", "Browser"],
  ["Web", "Performance"],
  ["Every Layout"],
  ["CSS Secrets"],
  ["JavaScript", "Patterns"],
  ["Types and", "Programming"],
  ["Structure and", "Interpretation"],
  ["The Art of", "Computer", "Programming"],
  ["Algorithms"],
  ["Distributed", "Systems"],
  ["Site", "Reliability"],
  ["Cryptography", "Engineering"],
  ["Deep", "Learning"],
  ["Information", "Theory"],
  ["The Making of", "a Studio"],
  ["Notes on", "Craft"],
];

/**
 * The publisher's mark at the foot of a spine. Flat and geometric rather than an engraved
 * device: an outlined globe or armillary is the single detail that dates a binding hardest,
 * and at five pixels a filled shape is also the only kind that survives being seen at all.
 */
type BookEmblem = "square" | "dot" | "stack" | "slash" | "ring" | "notch";

const BOOK_EMBLEMS: readonly BookEmblem[] = ["square", "dot", "stack", "slash", "ring", "notch"];

export type BookDesign = {
  cloth: BookCloth;
  title: readonly string[];
  emblem: BookEmblem;
  /** Seeds the cloth grain, so two books bound in the same cloth are not the same object. */
  grain: number;
};

/**
 * Cloth and title are stepped rather than drawn, by a stride coprime with each catalog's
 * length. That is what guarantees the one thing a random shelf gets wrong and no assertion
 * about ranges would catch: two neighbors bound and titled the same. The cycle also spends
 * the whole palette across a row instead of leaving it to the law of averages.
 */
const CLOTH_STRIDE = 5;
const TITLE_STRIDE = 11;

export function bookDesign(order: number): BookDesign {
  const step = Math.abs(Math.trunc(order));
  const cloth = BOOK_CLOTHS[(step * CLOTH_STRIDE) % BOOK_CLOTHS.length];
  const titleIndex = (step * TITLE_STRIDE) % BOOK_TITLES.length;
  const title = BOOK_TITLES[titleIndex];
  const emblem = BOOK_EMBLEMS[titleIndex % BOOK_EMBLEMS.length];

  return {
    cloth: cloth ?? BOOK_CLOTHS[0],
    title: title ?? BOOK_TITLES[0],
    emblem: emblem ?? "ring",
    grain: step,
  };
}

/**
 * How a book sits, which is the whole of what decides where its art goes: the spine faces
 * out, the page block faces up on a shelf and sideways in a stack, and the covers take what
 * is left. Two poses is all the room has, and deriving the six faces from one of them is
 * what keeps a book from being assembled face by face at the call site.
 */
export type FaceKey = "px" | "nx" | "py" | "ny" | "pz" | "nz";
export type BookPose =
  { kind: "upright"; spine: "px" | "pz" } | { kind: "flat"; spine: "px" | "nx" | "pz" | "nz" };

/** What is printed on one face. */
type FacePrint = "spine" | "pages" | "cover";

export function facePrint(pose: BookPose, face: FaceKey): FacePrint {
  if (face === pose.spine) return "spine";
  if (pose.kind === "upright") return face === "py" ? "pages" : "cover";
  return face === "py" || face === "ny" ? "cover" : "pages";
}

/**
 * Which way the page edges run on the face that shows them. Pages stack across the book's
 * thickness, so the striations lie at right angles to it — and which image axis that is
 * depends on the pose, because a face's own axes do.
 */
type PageGrain = "horizontal" | "vertical";

export function pageGrain(pose: BookPose): PageGrain {
  // Upright with the spine out along z, the top face runs thickness across the image; the
  // other two poses run it up the image instead.
  return pose.kind === "upright" && pose.spine === "pz" ? "vertical" : "horizontal";
}

/**
 * One book, ready to be painted and built. `size` is the box, `position` its center in the
 * group the geometry mounts into, and the array index is the atlas cell — so a book cannot
 * be painted into one cell and mapped to another.
 */
export type BookPlacement = {
  key: string;
  position: Vec3;
  size: Vec3;
  rotation: Vec3;
  pose: BookPose;
  design: BookDesign;
};

/**
 * The atlas. A cell is sized for the largest spine the room contains, at a resolution set by
 * the writing station — the camera sits about 1.6 m off the bookshelf there, where a spine
 * covers rather more screen than a smaller cell would have pixels for. The cost is real and
 * deliberate: at 48×256 a cell is ~48 KB, so the bookshelf's 83 spines are ~4.7 MB and the
 * floating shelves' 38 are ~2.4 MB. See `docs/decisions.md`.
 */
export const BOOK_CELL = { width: 48, height: 256 } as const;
export const BOOK_PIXELS_PER_METER = 512;
const ATLAS_COLUMNS = 16;

export type BookAtlasLayout = {
  columns: number;
  rows: number;
  width: number;
  height: number;
};

export function bookAtlasLayout(count: number): BookAtlasLayout {
  const columns = Math.min(ATLAS_COLUMNS, Math.max(1, count));
  const rows = Math.max(1, Math.ceil(count / columns));

  return {
    columns,
    rows,
    width: columns * BOOK_CELL.width,
    height: rows * BOOK_CELL.height,
  };
}

/**
 * A cell is three zones down its length, and every one of them has to stay a zone: the
 * covers take their color from a patch of *unpainted* cloth, so anything that grew into the
 * band between the page block and the spine would print the spine's own ink on them.
 */
const CELL_INSET = 2;
const PAGE_ZONE = { top: 2, height: 28 } as const;
const COVER_ZONE = { top: 34, height: 20 } as const;
const SPINE_ZONE = { top: 58, bottom: BOOK_CELL.height - CELL_INSET } as const;
const SPINE_MAX_WIDTH = BOOK_CELL.width - CELL_INSET * 2;
const SPINE_MAX_HEIGHT = SPINE_ZONE.bottom - SPINE_ZONE.top;
const SPINE_MIN_WIDTH = 6;
const SPINE_MIN_HEIGHT = 24;

export type Rect = { x: number; y: number; width: number; height: number };

/**
 * The spine face's own dimensions, in meters. A spine is the shorter and the longer of the
 * two extents of whichever face it is on, in that order — every book in the room is taller
 * than it is thick, so the pose never has to say which is which.
 */
export function spineFaceSize(size: Vec3, pose: BookPose): { thickness: number; height: number } {
  const axis = pose.spine.endsWith("x") ? 0 : 2;
  const [a, b] = axis === 0 ? [size[1], size[2]] : [size[0], size[1]];

  return { thickness: Math.min(a, b), height: Math.max(a, b) };
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/** Where the three kinds of art for one book land in the atlas, in canvas pixels. */
export function bookCellRects(
  index: number,
  layout: BookAtlasLayout,
  book: BookPlacement,
): Record<FacePrint, Rect> {
  const originX = (index % layout.columns) * BOOK_CELL.width;
  const originY = Math.floor(index / layout.columns) * BOOK_CELL.height;
  const { thickness, height } = spineFaceSize(book.size, book.pose);
  const width = clamp(
    Math.round(thickness * BOOK_PIXELS_PER_METER),
    SPINE_MIN_WIDTH,
    SPINE_MAX_WIDTH,
  );
  const length = clamp(
    Math.round(height * BOOK_PIXELS_PER_METER),
    SPINE_MIN_HEIGHT,
    SPINE_MAX_HEIGHT,
  );

  return {
    spine: {
      x: originX + CELL_INSET,
      y: originY + SPINE_ZONE.bottom - length,
      width,
      height: length,
    },
    pages: {
      x: originX + CELL_INSET,
      y: originY + PAGE_ZONE.top,
      width,
      height: PAGE_ZONE.height,
    },
    cover: {
      x: originX + CELL_INSET + 6,
      y: originY + COVER_ZONE.top,
      width: 16,
      height: COVER_ZONE.height - 4,
    },
  };
}

const BOOK_FONT = `"Geist", ui-sans-serif, system-ui, sans-serif`;
/** Set at a probe size and scaled from what it measured; canvas has no "fit this box". */
const PROBE_PX = 100;
const MIN_TITLE_PX = 4.5;
/**
 * How wide a spine has to be to carry its title across it rather than up it. A width in
 * pixels rather than a fitted font size, because the fitted size depends on the font the
 * browser actually resolved and this decision should not: it is a fact about the book.
 */
const FLAT_SPINE_PX = 26;
const TITLE_LEADING = 1.16;
/** The stretch of spine the title gets, between the head band and the publisher's mark. */
const TITLE_TOP = 0.17;
const TITLE_BOTTOM = 0.83;
/** The publisher's band at the head, the narrower one at the tail, and where the mark sits. */
const HEAD_BAND = 0.085;
const TAIL_BAND = 0.03;
const MARK_AT = 0.9;
const GRAIN_STROKES = 26;
const CAP_HEIGHT = 2;

function paintPageBlock(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  grain: PageGrain,
  random: () => number,
): void {
  // The inset is the cover boards standing proud of the block they hold, which is the whole
  // of what stops a book from reading as a solid bar seen end-on.
  const inset = 2;
  const x = rect.x + inset;
  const y = rect.y + inset;
  const width = Math.max(2, rect.width - inset * 2);
  const height = Math.max(2, rect.height - inset * 2);

  ctx.fillStyle = PAGE_PAPER;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = PAGE_LINE;
  if (grain === "horizontal") {
    for (let line = y + 1; line < y + height; line += 2) {
      if (random() < 0.55) ctx.fillRect(x, line, width, 1);
    }
  } else {
    for (let line = x + 1; line < x + width; line += 2) {
      if (random() < 0.55) ctx.fillRect(line, y, 1, height);
    }
  }

  ctx.fillStyle = PAGE_SHADE;
  ctx.fillRect(x, y, width, 1);
  ctx.fillRect(x, y, 1, height);
}

type TitleSetting = { lines: readonly string[]; size: number; turned: boolean };

/**
 * The largest these lines can be set on this spine, one way round. Canvas has no "fit this
 * box", so the lines are measured once at a probe size and the result is scaled to whichever
 * of the two directions runs out first, capped so a squat book is not lettered in slab.
 */
function setTitle(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  lines: readonly string[],
  turned: boolean,
): TitleSetting {
  const along = rect.height * (TITLE_BOTTOM - TITLE_TOP);
  const across = Math.max(1, rect.width - 4);

  ctx.font = `600 ${PROBE_PX}px ${BOOK_FONT}`;
  const widest = Math.max(1, ...lines.map((line) => ctx.measureText(line).width));
  const stack = lines.length * TITLE_LEADING;

  const size = turned
    ? Math.min((PROBE_PX * along) / widest, across / stack, rect.width * 0.44)
    : Math.min((PROBE_PX * across) / widest, along / stack, rect.height * 0.085);

  return { lines, size, turned };
}

function paintTitle(ctx: CanvasRenderingContext2D, rect: Rect, design: BookDesign): void {
  // A shelf is not lettered all one way. A spine wide enough to read the title across it is
  // set that way even though turning it would always fit more — running everything up the
  // spine because the spine is the longer direction is what makes a generated shelf look
  // generated. Below that width the lines are turned, and collapsed to one if stacking them
  // across a narrow spine would leave them too small to read.
  const flat = setTitle(ctx, rect, design.title, false);
  const stacked = setTitle(ctx, rect, design.title, true);
  const joined =
    design.title.length > 1 ? setTitle(ctx, rect, [design.title.join(" ")], true) : stacked;

  const turned = joined.size > stacked.size ? joined : stacked;
  const readable = rect.width >= FLAT_SPINE_PX && flat.size >= MIN_TITLE_PX;
  const setting = readable ? flat : turned;

  if (setting.size < MIN_TITLE_PX) return;

  ctx.fillStyle = design.cloth.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${setting.size.toFixed(2)}px ${BOOK_FONT}`;

  const middle = rect.y + rect.height * ((TITLE_TOP + TITLE_BOTTOM) / 2);
  const offsetOf = (index: number): number =>
    (index - (setting.lines.length - 1) / 2) * setting.size * TITLE_LEADING;

  if (!setting.turned) {
    setting.lines.forEach((line, index) => {
      ctx.fillText(line, rect.x + rect.width / 2, middle + offsetOf(index));
    });
    return;
  }

  ctx.save();
  ctx.translate(rect.x + rect.width / 2, middle);
  // Reading bottom to top, so a row of spines is read with the head tilted left.
  ctx.rotate(-Math.PI / 2);
  setting.lines.forEach((line, index) => {
    ctx.fillText(line, 0, offsetOf(index));
  });
  ctx.restore();
}

/**
 * The publisher's mark at the foot of the spine: flat shapes, filled, never outlined. It is
 * printed in the band's color rather than the title's ink — a mark louder than the title it
 * sits under is the wrong way round, and it ties the foot of the spine to its head.
 */
function paintEmblem(ctx: CanvasRenderingContext2D, rect: Rect, design: BookDesign): void {
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height * MARK_AT;
  const radius = Math.max(1.5, Math.min(rect.width * 0.17, rect.height * 0.023));

  ctx.fillStyle = design.cloth.band;

  switch (design.emblem) {
    case "square":
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      break;
    case "dot":
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "stack":
      for (const shift of [-radius * 0.8, radius * 0.2]) {
        ctx.fillRect(x - radius * 1.3, y + shift, radius * 2.6, radius * 0.6);
      }
      break;
    case "slash": {
      // Drawn as a leaning quad rather than a turned rectangle: a `rotate` here would be the
      // one mark in the atlas painted in a frame of its own, and the cell-bounds check reads
      // coordinates as written.
      const lean = radius * 0.6;
      ctx.beginPath();
      ctx.moveTo(x - radius * 0.3 + lean, y - radius * 1.2);
      ctx.lineTo(x + radius * 0.3 + lean, y - radius * 1.2);
      ctx.lineTo(x + radius * 0.3 - lean, y + radius * 1.2);
      ctx.lineTo(x - radius * 0.3 - lean, y + radius * 1.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "ring":
      // Filled, then punched back to the cloth: an outline this small is a smudge.
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = design.cloth.cloth;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "notch":
      ctx.fillRect(x - radius * 1.2, y - radius * 0.35, radius * 2.4, radius * 0.7);
      ctx.fillRect(x - radius * 0.35, y - radius * 1.2, radius * 0.7, radius * 2.4);
      break;
  }
}

function paintSpine(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  design: BookDesign,
  random: () => number,
): void {
  const { x, y, width, height } = rect;

  const shade = ctx.createLinearGradient(x, 0, x + width, 0);
  for (const [stop, color] of SPINE_SHADE) shade.addColorStop(stop, color);
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = CLOTH_GRAIN;
  for (let stroke = 0; stroke < GRAIN_STROKES; stroke += 1) {
    const top = y + Math.floor(random() * height);
    ctx.fillRect(
      x + Math.floor(random() * width),
      top,
      1,
      Math.min(4 + Math.floor(random() * 18), y + height - top),
    );
  }

  // The publisher's band across the head, and a narrower one at the tail. A block of flat
  // color edge to edge is what the paired rules it replaced are not: those sit inside a
  // margin and frame the spine, which is a binder's convention and reads as one.
  ctx.fillStyle = design.cloth.band;
  ctx.fillRect(x, y, width, Math.max(2, Math.round(height * HEAD_BAND)));
  ctx.fillRect(
    x,
    y + height - Math.round(height * TAIL_BAND),
    width,
    Math.max(1, Math.round(height * TAIL_BAND)),
  );

  // The head and tail of the block, which sit in the cover's shadow on every real binding.
  ctx.fillStyle = HEAD_CAP;
  ctx.fillRect(x, y, width, CAP_HEIGHT);
  ctx.fillRect(x, y + height - CAP_HEIGHT, width, CAP_HEIGHT);

  paintTitle(ctx, rect, design);
  paintEmblem(ctx, rect, design);
}

/** Paints every book into its own cell. The index *is* the cell, for both art and UVs. */
export function paintBookAtlas(
  ctx: CanvasRenderingContext2D,
  books: readonly BookPlacement[],
): void {
  const layout = bookAtlasLayout(books.length);

  books.forEach((book, index) => {
    const rects = bookCellRects(index, layout, book);
    const random = mulberry32(book.design.grain * 977 + index + 1);

    // Flooded first, so the patch the covers sample is this book's cloth and nothing else.
    ctx.fillStyle = book.design.cloth.cloth;
    ctx.fillRect(
      (index % layout.columns) * BOOK_CELL.width,
      Math.floor(index / layout.columns) * BOOK_CELL.height,
      BOOK_CELL.width,
      BOOK_CELL.height,
    );

    paintPageBlock(ctx, rects.pages, pageGrain(book.pose), random);
    paintSpine(ctx, rects.spine, book.design, random);
  });
}

export function createBookAtlasTexture(books: readonly BookPlacement[]): CanvasTexture {
  const layout = bookAtlasLayout(books.length);
  const { canvas, texture } = createCanvasTexture(layout.width, layout.height, {
    // A shelf is the opposite of a screen: painted once, then read at a glancing angle from
    // across the room, where an unmipmapped band edge crawls on every camera move.
    mipmapped: true,
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  paintBookAtlas(ctx, books);
  texture.needsUpdate = true;
  return texture;
}

type Face = { key: FaceKey; normal: Vec3; u: Vec3; v: Vec3 };

/**
 * The six faces, each with the two in-plane axes that make `u × v = normal` — which is what
 * winds every triangle counter-clockwise seen from outside, so the room's single-sided
 * materials face the right way without a `side` override.
 */
const FACES: readonly Face[] = [
  { key: "px", normal: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { key: "nx", normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { key: "py", normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { key: "ny", normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { key: "pz", normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { key: "nz", normal: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
];

const CORNERS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

// Built once per shelving unit rather than per frame, but hoisted all the same: the loop
// below runs 726 times for the bookshelf alone.
const bookRotation = new Matrix4();
const bookEuler = new Euler();
const bookCorner = new Vector3();
const bookNormal = new Vector3();

function halfAlong(axis: Vec3, size: Vec3): number {
  return (
    (Math.abs(axis[0]) * size[0] + Math.abs(axis[1]) * size[1] + Math.abs(axis[2]) * size[2]) / 2
  );
}

/**
 * The four corner UVs, in the order the corners are emitted. A quarter turn lays the art's
 * length along the face's width, which is what a book in a stack needs: a spine is always
 * printed up its cell, and the pose decides which way up that ends up being.
 */
export function faceUV(
  rect: Rect,
  layout: BookAtlasLayout,
  quarterTurn: boolean,
): readonly number[] {
  const u0 = rect.x / layout.width;
  const u1 = (rect.x + rect.width) / layout.width;
  // Canvas y runs down and a texture's v runs up, so the rect's top edge is the higher v.
  const v0 = 1 - (rect.y + rect.height) / layout.height;
  const v1 = 1 - rect.y / layout.height;

  if (quarterTurn) return [u1, v0, u1, v1, u0, v1, u0, v0];
  return [u0, v0, u1, v0, u1, v1, u0, v1];
}

/**
 * Every book in one unit, merged into one geometry with its placement baked in. The books
 * do not move, so the transform that an `InstancedMesh` would carry per instance is spent
 * once here instead — and it buys the per-book UVs instancing cannot express.
 */
export function createBookGeometry(books: readonly BookPlacement[]): BufferGeometry {
  const layout = bookAtlasLayout(books.length);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  books.forEach((book, index) => {
    const rects = bookCellRects(index, layout, book);
    bookRotation.makeRotationFromEuler(bookEuler.fromArray([...book.rotation]));

    for (const face of FACES) {
      const print = facePrint(book.pose, face.key);
      const alongNormal = halfAlong(face.normal, book.size);
      const alongU = halfAlong(face.u, book.size);
      const alongV = halfAlong(face.v, book.size);
      const first = positions.length / 3;

      for (const [towardU, towardV] of CORNERS) {
        bookCorner
          .set(
            face.normal[0] * alongNormal +
              face.u[0] * alongU * towardU +
              face.v[0] * alongV * towardV,
            face.normal[1] * alongNormal +
              face.u[1] * alongU * towardU +
              face.v[1] * alongV * towardV,
            face.normal[2] * alongNormal +
              face.u[2] * alongU * towardU +
              face.v[2] * alongV * towardV,
          )
          .applyMatrix4(bookRotation);
        positions.push(
          book.position[0] + bookCorner.x,
          book.position[1] + bookCorner.y,
          book.position[2] + bookCorner.z,
        );
      }

      bookNormal
        .fromArray([...face.normal])
        .applyMatrix4(bookRotation)
        .normalize();
      for (let corner = 0; corner < CORNERS.length; corner += 1) {
        normals.push(bookNormal.x, bookNormal.y, bookNormal.z);
      }

      // Only the spine is printed along the book's length, so only it can end up turned.
      uvs.push(...faceUV(rects[print], layout, print === "spine" && alongV < alongU));
      indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

/** Cloth and paper, both matte. Nothing on a book is a specular surface at this distance. */
const BOOK_BINDING = { roughness: 0.88, metalness: 0 } as const;

/**
 * One shelving unit's books: one mesh, one atlas, both released with the canvas. Unlike the
 * instanced version this replaced, the mesh's bounds are the books' own, so it culls the way
 * every other prop in the room does.
 */
export function Books({ books }: { books: readonly BookPlacement[] }): ReactElement {
  const atlas = useDisposable(() => createBookAtlasTexture(books));
  const geometry = useDisposable(() => createBookGeometry(books));

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial map={atlas} {...BOOK_BINDING} />
    </mesh>
  );
}

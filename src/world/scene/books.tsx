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
 * made of, and a palette a canvas mixes lives with the routine that mixes it, as the
 * city's lit offices do.
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
/** One leaf, and the gap between two gatherings. */
const PAGE_LEAF = "rgba(88, 102, 110, 0.15)";
const PAGE_GATHERING = "rgba(46, 56, 64, 0.5)";
/**
 * A block across its own thickness: darkest where it meets each board, lightest in the
 * middle. Without it a stacked book's fore-edge is a flat white bar, brighter than anything
 * else this room contains.
 */
const PAGE_SHADE: readonly (readonly [number, string])[] = [
  [0, "rgba(10, 16, 20, 0.55)"],
  [0.18, "rgba(10, 16, 20, 0.14)"],
  [0.5, "rgba(255, 255, 255, 0.05)"],
  [0.82, "rgba(10, 16, 20, 0.18)"],
  [1, "rgba(10, 16, 20, 0.5)"],
];
/** The board edge showing at each end of the block, as a share of the book's thickness. */
const BOARD_SHARE = 0.09;

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
 * The atlas. A shelved book's cell is sized for the largest spine the room contains, at a
 * resolution set by the writing station — the camera sits about 1.6 m off the bookshelf
 * there, where a spine covers rather more screen than a smaller cell would have pixels for.
 * The cost is real and deliberate: at 48×256 a cell is ~48 KB, so the bookshelf's 83 spines
 * are ~4.7 MB and the floating shelves' 38 are ~2.4 MB. See `docs/decisions.md`.
 */
export const BOOK_CELL = { width: 48, height: 256 } as const;

/**
 * A stacked book's cell, which has to hold something a shelved one never shows: a cover, two
 * orders of magnitude more surface than a spine and the face a visitor standing over a
 * coffee table sees most of. Painted into a shelf cell it came out at a quarter of the
 * room's pixels-per-meter — a seven-pixel title smeared across twenty centimeters of board —
 * so it gets a cell that holds it at the same scale as everything else instead.
 *
 * This is affordable only because there are three of them: one cell is ~197 KB, so the whole
 * coffee table costs under 600 KB against the bookshelf's 4.7 MB. It is not a size the
 * shelves could be given.
 */
export const STACKED_CELL = { width: 128, height: 384 } as const;
export const BOOK_PIXELS_PER_METER = 512;
const ATLAS_COLUMNS = 16;

export type BookAtlasLayout = {
  cell: { width: number; height: number };
  columns: number;
  rows: number;
  width: number;
  height: number;
};

/**
 * The cell is a property of the atlas rather than of the room, because the two poses need
 * different ones and every cell in one canvas has to be the same size for the index to be
 * the cell. Each shelving unit and the coffee table build their own, and no atlas in the
 * room mixes poses — a mixed one would simply pay the stacked cell for all of them.
 */
export function bookAtlasLayout(books: readonly BookPlacement[]): BookAtlasLayout {
  const cell = books.some((book) => book.pose.kind === "flat") ? STACKED_CELL : BOOK_CELL;
  const columns = Math.min(ATLAS_COLUMNS, Math.max(1, books.length));
  const rows = Math.max(1, Math.ceil(books.length / columns));

  return {
    cell,
    columns,
    rows,
    width: columns * cell.width,
    height: rows * cell.height,
  };
}

/**
 * A cell is three zones down its length, and every one of them has to stay a zone. The two
 * poses divide it the other way round from each other, because the pose inverts which faces
 * a visitor actually sees.
 */
const CELL_INSET = 2;
/** The gutter between two zones — enough that no filtered texel reaches the next one. */
const ZONE_GAP = 4;
const SPINE_MIN_WIDTH = 6;
const SPINE_MIN_HEIGHT = 24;

type CellZones = {
  /** Where the cover sits and the most of the cell it may take. */
  cover: Rect;
  pages: { top: number; height: number };
  /** The spine takes the length left under the other two, and stands on `foot`. */
  spine: { top: number; foot: number };
};

/**
 * A shelved book's cell, in the order the three zones run down it: block, cover, spine. Its
 * cover is the face against the wall and never printed, so the zone is a swatch of
 * *unpainted* cloth the other two have to stay clear of — anything that grew into it would
 * print the spine's own ink on the sides of the book next to this one.
 */
const SHELVED_ZONES: CellZones = {
  pages: { top: CELL_INSET, height: 28 },
  cover: { x: CELL_INSET + 6, y: 34, width: 16, height: 16 },
  spine: { top: 58, foot: BOOK_CELL.height - CELL_INSET },
};

/**
 * A stacked book's, which is the same three zones with the sizes traded: cover first and
 * largest, because on a table it is the face in shot rather than the one against the wall.
 * It is drawn at the room's own pixels-per-meter — 164 px is a 0.32 m board — and the block
 * and the spine take what is left under it.
 */
const STACKED_COVER_HEIGHT = 164;
const STACKED_PAGE_HEIGHT = 24;
const STACKED_ZONES: CellZones = {
  cover: {
    x: CELL_INSET,
    y: CELL_INSET,
    width: STACKED_CELL.width - CELL_INSET * 2,
    height: STACKED_COVER_HEIGHT,
  },
  pages: { top: CELL_INSET + STACKED_COVER_HEIGHT + ZONE_GAP, height: STACKED_PAGE_HEIGHT },
  spine: {
    top: CELL_INSET + STACKED_COVER_HEIGHT + ZONE_GAP + STACKED_PAGE_HEIGHT + ZONE_GAP,
    foot: STACKED_CELL.height - CELL_INSET,
  },
};

function cellZones(pose: BookPose): CellZones {
  return pose.kind === "flat" ? STACKED_ZONES : SHELVED_ZONES;
}

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

/**
 * The cover face's own dimensions, in meters — the shorter extent across, the longer up, the
 * way the spine's are, so a cover is printed portrait and a book that is wider than it is
 * tall is turned rather than lettered sideways. A stacked book's covers are its top and its
 * bottom, so they are its footprint.
 */
export function coverFaceSize(size: Vec3): { width: number; height: number } {
  return { width: Math.min(size[0], size[2]), height: Math.max(size[0], size[2]) };
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
  const originX = (index % layout.columns) * layout.cell.width;
  const originY = Math.floor(index / layout.columns) * layout.cell.height;
  const zones = cellZones(book.pose);
  const stacked = book.pose.kind === "flat";
  const across = layout.cell.width - CELL_INSET * 2;

  const { thickness, height } = spineFaceSize(book.size, book.pose);
  const width = clamp(Math.round(thickness * BOOK_PIXELS_PER_METER), SPINE_MIN_WIDTH, across);
  const length = clamp(
    Math.round(height * BOOK_PIXELS_PER_METER),
    SPINE_MIN_HEIGHT,
    zones.spine.foot - zones.spine.top,
  );

  // A cover is drawn at the same pixels-per-meter as a spine, and scaled down whole if the
  // zone cannot hold it — never squeezed, which would letter a board out of proportion to
  // the spine beside it.
  const cover = coverFaceSize(book.size);
  const wanted = {
    width: Math.round(cover.width * BOOK_PIXELS_PER_METER),
    height: Math.round(cover.height * BOOK_PIXELS_PER_METER),
  };
  const fit = Math.min(zones.cover.width / wanted.width, zones.cover.height / wanted.height, 1);

  return {
    // A shelved spine stands on the foot of its cell so a short book is short rather than
    // floating; a stacked one hangs from under the block, because what is under it is the
    // end of the cell rather than a shelf.
    spine: {
      x: originX + CELL_INSET,
      y: originY + (stacked ? zones.spine.top : zones.spine.foot - length),
      width,
      height: length,
    },
    // The block is uniform along its length and detailed only across the thickness, so this
    // rect's width is resolution rather than art — one value serves all three cut edges of
    // a stacked book however differently long they are.
    pages: {
      x: originX + CELL_INSET,
      y: originY + zones.pages.top,
      width: across,
      height: zones.pages.height,
    },
    cover: {
      x: originX + zones.cover.x,
      y: originY + zones.cover.y,
      width: stacked
        ? Math.max(SPINE_MIN_WIDTH, Math.round(wanted.width * fit))
        : zones.cover.width,
      height: stacked
        ? Math.max(SPINE_MIN_HEIGHT, Math.round(wanted.height * fit))
        : zones.cover.height,
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

/**
 * The cut edges of the block. Two things about it are decided by the pose rather than drawn:
 *
 * **The boards inset the block across the thickness and nowhere else.** The cloth turning
 * over a real binding is a couple of millimeters, and the rect's other axis runs the whole
 * length of the face — up to a third of a meter on a stacked book's fore-edge, where an inset
 * of the same two pixels printed those millimeters as five centimeters of black. That is what
 * made a stacked book read as a white slab wedged between two dark ones. Along the length
 * the block runs edge to edge, which also lets one rect serve all three cut edges of a
 * stacked book however differently long they are.
 *
 * **Every leaf, not every other one.** At a shelved book's scale the gapped striations were
 * a texture; at a stacked one's they were corrugation.
 */
function paintPageBlock(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  grain: PageGrain,
  random: () => number,
): void {
  const across = grain === "horizontal" ? rect.height : rect.width;
  const board = Math.max(1, Math.round(across * BOARD_SHARE));
  const flat = grain === "horizontal";
  const x = flat ? rect.x : rect.x + board;
  const y = flat ? rect.y + board : rect.y;
  const width = flat ? rect.width : Math.max(1, rect.width - board * 2);
  const height = flat ? Math.max(1, rect.height - board * 2) : rect.height;
  const leaves = flat ? height : width;

  ctx.fillStyle = PAGE_PAPER;
  ctx.fillRect(x, y, width, height);

  for (let leaf = 0; leaf < leaves; leaf += 1) {
    const gathering = random() < 0.14;
    if (!gathering && random() < 0.4) continue;
    ctx.fillStyle = gathering ? PAGE_GATHERING : PAGE_LEAF;
    if (flat) ctx.fillRect(x, y + leaf, width, 1);
    else ctx.fillRect(x + leaf, y, 1, height);
  }

  const shade = flat
    ? ctx.createLinearGradient(0, y, 0, y + height)
    : ctx.createLinearGradient(x, 0, x + width, 0);
  for (const [stop, color] of PAGE_SHADE) shade.addColorStop(stop, color);
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, width, height);
}

type TitleSetting = { lines: readonly string[]; size: number; turned: boolean };

/**
 * The largest these lines fit in, set one way round. Canvas has no "fit this box", so they
 * are measured once at a probe size and scaled to whichever of the two directions runs out
 * first — `along` the lines, `across` the stack of them — capped so a squat box is not
 * lettered in slab.
 */
function fitLines(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  along: number,
  across: number,
  leading: number,
  cap: number,
): number {
  ctx.font = `600 ${PROBE_PX}px ${BOOK_FONT}`;
  const widest = Math.max(1, ...lines.map((line) => ctx.measureText(line).width));

  return Math.min((PROBE_PX * along) / widest, across / (lines.length * leading), cap);
}

/** The largest these lines can be set on this spine, one way round. */
function setTitle(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  lines: readonly string[],
  turned: boolean,
): TitleSetting {
  const along = rect.height * (TITLE_BOTTOM - TITLE_TOP);
  const across = Math.max(1, rect.width - 4);

  const size = turned
    ? fitLines(ctx, lines, along, across, TITLE_LEADING, rect.width * 0.44)
    : fitLines(ctx, lines, across, along, TITLE_LEADING, rect.height * 0.085);

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
function paintEmblem(
  ctx: CanvasRenderingContext2D,
  design: BookDesign,
  x: number,
  y: number,
  radius: number,
): void {
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
  paintEmblem(
    ctx,
    design,
    rect.x + rect.width / 2,
    rect.y + rect.height * MARK_AT,
    Math.max(1.5, Math.min(rect.width * 0.17, rect.height * 0.023)),
  );
}

/**
 * The board a stacked book shows face up: a sheen across the cloth, the title blocked on it,
 * a rule under the title and the publisher's mark at the foot. It is the same binding the
 * spine is printed in and says the same thing, because it is the same book — what it is not
 * is a patch of flat cloth, which is what the shelved layout hands its covers and what made
 * three books on a table read as three slabs.
 */
const COVER_TITLE_TOP = 0.22;
const COVER_TITLE_BOTTOM = 0.6;
const COVER_TITLE_LEADING = 1.22;
const COVER_RULE_AT = 0.68;
const COVER_MARK_AT = 0.85;
const MIN_COVER_TITLE_PX = 3.5;
/** The board's own edge, which is what separates a cover from the block it closes over. */
const COVER_EDGE = "rgba(0, 0, 0, 0.45)";
const COVER_SHEEN: readonly (readonly [number, string])[] = [
  [0, "rgba(255, 255, 255, 0.1)"],
  [0.55, "rgba(255, 255, 255, 0.02)"],
  [1, "rgba(0, 0, 0, 0.18)"],
];

function paintCover(ctx: CanvasRenderingContext2D, rect: Rect, design: BookDesign): void {
  const { x, y, width, height } = rect;

  const sheen = ctx.createLinearGradient(x, y, x + width, y + height);
  for (const [stop, color] of COVER_SHEEN) sheen.addColorStop(stop, color);
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = COVER_EDGE;
  ctx.fillRect(x, y, width, 1);
  ctx.fillRect(x, y + height - 1, width, 1);
  ctx.fillRect(x, y, 1, height);
  ctx.fillRect(x + width - 1, y, 1, height);

  const size = fitLines(
    ctx,
    design.title,
    width * 0.76,
    height * (COVER_TITLE_BOTTOM - COVER_TITLE_TOP),
    COVER_TITLE_LEADING,
    height * 0.14,
  );

  if (size >= MIN_COVER_TITLE_PX) {
    ctx.fillStyle = design.cloth.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${size.toFixed(2)}px ${BOOK_FONT}`;

    const middle = y + height * ((COVER_TITLE_TOP + COVER_TITLE_BOTTOM) / 2);
    design.title.forEach((line, index) => {
      const offset = (index - (design.title.length - 1) / 2) * size * COVER_TITLE_LEADING;
      ctx.fillText(line, x + width / 2, middle + offset);
    });
  }

  ctx.fillStyle = design.cloth.band;
  ctx.fillRect(
    x + width * 0.3,
    y + Math.round(height * COVER_RULE_AT),
    Math.max(1, Math.round(width * 0.4)),
    Math.max(1, Math.round(height * 0.012)),
  );

  paintEmblem(
    ctx,
    design,
    x + width / 2,
    y + height * COVER_MARK_AT,
    Math.max(1.5, Math.min(width * 0.07, height * 0.05)),
  );
}

/** Paints every book into its own cell. The index *is* the cell, for both art and UVs. */
export function paintBookAtlas(
  ctx: CanvasRenderingContext2D,
  books: readonly BookPlacement[],
): void {
  const layout = bookAtlasLayout(books);

  books.forEach((book, index) => {
    const rects = bookCellRects(index, layout, book);
    const random = mulberry32(book.design.grain * 977 + index + 1);

    // Flooded first, so the patch a shelved book's covers sample is this book's cloth and
    // nothing else, and a stacked one's board is printed over its own binding.
    ctx.fillStyle = book.design.cloth.cloth;
    ctx.fillRect(
      (index % layout.columns) * layout.cell.width,
      Math.floor(index / layout.columns) * layout.cell.height,
      layout.cell.width,
      layout.cell.height,
    );

    paintPageBlock(ctx, rects.pages, pageGrain(book.pose), random);
    paintSpine(ctx, rects.spine, book.design, random);
    // Only a stacked book. A shelved one's covers face the wall, the shelf and its
    // neighbors, so they stay the swatch of unpainted cloth the flood above left them.
    if (book.pose.kind === "flat") paintCover(ctx, rects.cover, book.design);
  });
}

export function createBookAtlasTexture(books: readonly BookPlacement[]): CanvasTexture {
  const layout = bookAtlasLayout(books);
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
  const layout = bookAtlasLayout(books);
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

      // The spine and the cover are both printed portrait up their cell, so either can land
      // on a face whose long axis is the other one and need turning. The block is drawn
      // across its thickness, which `pageGrain` has already resolved, so it never turns.
      uvs.push(...faceUV(rects[print], layout, print !== "pages" && alongV < alongU));
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

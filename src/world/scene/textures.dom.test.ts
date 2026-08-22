import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { RepeatWrapping } from "three";

import {
  createRecordingContext,
  stubCanvasContexts,
  type RecordingContext,
} from "@tests/recording-ctx";

import {
  bookAtlasLayout,
  BOOK_CELL,
  bookCellRects,
  bookDesign,
  createBookAtlasTexture,
  paintBookAtlas,
  type BookPlacement,
} from "./books";
import {
  createFacadeTexture,
  createHazeTexture,
  createMasonryTexture,
  createRibbonTexture,
  createSkyTexture,
  createStreetTexture,
} from "./city";
import { KEYCAPS, KEY_FIELD_DEPTH, KEY_FIELD_WIDTH, useKeyboardLegendTexture } from "./keyboard";
import { createRemoteFaceTexture, REMOTE_PRINT } from "./remote";
import { SHELF_BOOKS } from "./shelving";
import { createPerforationTexture } from "./soundbar";

/**
 * The canvas textures the scene paints for itself: the curtain wall the city is clad in, the
 * sky and the haze behind it, and the legends on the keycaps. Each builds its own
 * canvas through `createCanvasTexture`, so none of them can be handed a context — the
 * recording stub answers `getContext` for the whole prototype instead.
 *
 * Two properties are worth the setup on all of them. They are seeded, so what a visitor
 * sees is the same on every load and reviewable here at all; and a browser that refuses a
 * 2D context must still get a texture back, because the alternative is the scene throwing
 * on mount rather than rendering an unpainted tower.
 */

/**
 * The curtain-wall sheet: 18 bays of 30 px across, 48 floors of 34 px up. Forty-eight rather
 * than thirty-two because a 56-storey tower read the old sheet nearly twice over, and the
 * repeat was legible on the pair that crop the window.
 */
const FACADE = {
  width: 540,
  height: 1632,
  bays: 18,
  floors: 48,
  bayPx: 30,
  floorPx: 34,
  /** The glass band under each floor's spandrel: what a lit pane fills. */
  glassPx: 23,
};
const PIXELS_PER_METER = 1500;
const OFFICE_LIGHT = ["#ffdfaa", "#f3f7fb", "#c6dcef", "#86d6e8"];
/** The one the ribbon slab may not use, for the reason its own spec gives. */
const CYAN_OFFICE_LIGHT = "#86d6e8";
/** The warmer set a lived-in room throws, which is what the masonry block lights in. */
const ROOM_LIGHT = ["#ffcd8e", "#ffe6bd", "#e8d5b8", "#9fc4dd"];
/** The perforation tile, and the field it holds: 8 holes across 128 px, so a 16 px pitch. */
const PERFORATION_TILE = 128;
const PERFORATION_HOLES = 8;
const PERFORATION_PITCH = PERFORATION_TILE / PERFORATION_HOLES;
/** The remote's field: a power/back rank above the clickpad and three ranks below it. */
const REMOTE_KEYS = 8;

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

function record(): readonly RecordingContext[] {
  stub = stubCanvasContexts();
  return stub.contexts;
}

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

/**
 * The panes: everything painted at bay width, which is the pane itself plus the ceiling wash
 * and sill line over it. The mullions are painted on every floor, lit or not, so matching on
 * "not a full-width coat" would count a dark floor as a lit one.
 */
const PANE_WIDTH = FACADE.bayPx - 3;

function windows(recording: RecordingContext): readonly (readonly number[])[] {
  return recording
    .callsTo("fillRect")
    .map((args) => args.map(Number))
    .filter(([, , w]) => w === PANE_WIDTH);
}

describe("curtain wall texture", () => {
  it("returns a texture rather than throwing when the browser refuses a context", () => {
    // jsdom's own answer, and a real browser's once too many contexts are live.
    expect(() => createFacadeTexture()).not.toThrow();
    expect(createFacadeTexture().image).toBeInstanceOf(HTMLCanvasElement);
  });

  /**
   * The sheet is tiled across every tower in the city, so it has to repeat in both axes.
   * Clamped, a tower reads as one stretched storey.
   */
  it("repeats in both axes", () => {
    const texture = createFacadeTexture();

    expect(texture.wrapS).toBe(RepeatWrapping);
    expect(texture.wrapT).toBe(RepeatWrapping);
  });

  it("lights some of the floors and leaves the rest dark", () => {
    const contexts = record();
    createFacadeTexture();

    // A floor's glass band is the full-width rect painted at the band's own height. The other
    // full-width rects per floor are the sill shadow and the transom line, which are the floor
    // grain a dark storey is read by — they are 3 px and 1 px, not a band.
    const bands = contexts[0]!
      .callsTo("fillRect")
      .map((args) => args.map(Number))
      .filter(([, , w, h]) => w === FACADE.width && h === FACADE.glassPx);
    expect(bands).toHaveLength(FACADE.floors);

    // A city with every floor lit, or none, is a rendering of something else.
    const litFloors = new Set(
      windows(contexts[0]!).map(([, y]) => Math.floor(y! / FACADE.floorPx)),
    );
    expect(litFloors.size).toBeGreaterThan(10);
    expect(litFloors.size).toBeLessThan(FACADE.floors);
  });

  it("keeps every pane inside the sheet and in the office palette", () => {
    const contexts = record();
    createFacadeTexture();
    const facade = contexts[0]!;

    for (const [x, y, w, h] of windows(facade)) {
      expect.soft(x!).toBeGreaterThanOrEqual(0);
      expect.soft(y!).toBeGreaterThanOrEqual(0);
      expect.soft(x! + w!).toBeLessThanOrEqual(FACADE.width);
      expect.soft(y! + h!).toBeLessThanOrEqual(FACADE.height);
    }

    const lit = facade
      .valuesOf("fillStyle")
      .filter((style) => OFFICE_LIGHT.includes(String(style)));
    expect(lit.length).toBeGreaterThan(0);
  });

  /**
   * Offices light by the floor plate, so a lit floor is a run of neighboring bays. Scattered
   * single panes are what made the previous city read as an advent calendar.
   */
  it("lights bays in runs rather than one at a time", () => {
    const contexts = record();
    createFacadeTexture();

    const byFloor = new Map<number, number[]>();
    for (const [x, y, , h] of windows(contexts[0]!)) {
      // The ceiling wash and the sill line are painted over a pane already counted.
      if (h !== FACADE.glassPx) continue;
      const floor = Math.floor(y! / FACADE.floorPx);
      byFloor.set(floor, [...(byFloor.get(floor) ?? []), Math.round(x! / FACADE.bayPx)]);
    }

    const runs = [...byFloor.values()].filter((bays) => {
      const sorted = [...new Set(bays)].sort((a, b) => a - b);
      return sorted.some((bay, i) => i > 0 && bay === sorted[i - 1]! + 1);
    });
    expect(runs.length).toBeGreaterThan(byFloor.size / 2);
  });

  it("varies the brightness per pane and hands the context back opaque", () => {
    const contexts = record();
    createFacadeTexture();

    const alphas = contexts[0]!.valuesOf("globalAlpha").map(Number);
    expect(new Set(alphas.slice(0, -1)).size).toBeGreaterThan(1);
    for (const alpha of alphas) expect.soft(alpha).toBeLessThanOrEqual(1);
    // The last write resets it. A facade that leaves alpha down tints everything the scene
    // paints onto a canvas afterwards.
    expect(alphas.at(-1)).toBe(1);
  });

  it("paints the same city every time", () => {
    const contexts = record();
    createFacadeTexture();
    createFacadeTexture();

    expect(contexts[1]!.transcript).toEqual(contexts[0]!.transcript);
  });
});

/**
 * The other two sheets a tower can be clad in. They exist because one sheet is what made the
 * last skyline read as one building repeated: the body tint multiplies a sheet that is nearly
 * black to begin with, so two glass towers stay two glass towers however they are tinted, and
 * only a different rhythm separates them. Each is checked for the rhythm that is its whole
 * reason to exist — otherwise a sheet can drift into looking like the one beside it and
 * nothing fails.
 */
const MASONRY = { width: 532, bays: 14, bayPx: 38, floors: 48, floorPx: 34 };
const RIBBON = { width: 520, bays: 20, bayPx: 26, floors: 48, floorPx: 34 };

describe("masonry texture", () => {
  it("returns a texture rather than throwing when the browser refuses a context", () => {
    expect(() => createMasonryTexture()).not.toThrow();
    expect(createMasonryTexture().image).toBeInstanceOf(HTMLCanvasElement);
  });

  it("repeats in both axes", () => {
    const texture = createMasonryTexture();

    expect(texture.wrapS).toBe(RepeatWrapping);
    expect(texture.wrapT).toBe(RepeatWrapping);
  });

  /**
   * A punched wall is a grid of holes in masonry, and the two things that say so are the pier
   * standing between every pair of openings and the reveal that sets each opening back into the
   * wall. Without them this is the curtain wall again with fewer windows.
   */
  it("punches every opening into a wall rather than glazing the bay", () => {
    const contexts = record();
    createMasonryTexture();
    const sheet = contexts[0]!;

    const rects = sheet.callsTo("fillRect").map((args) => args.map(Number));
    // The base coat is the same height, so a pier is one that does not span the whole sheet.
    const piers = rects.filter(
      ([, , w, h]) => h === MASONRY.floors * MASONRY.floorPx && w !== MASONRY.width,
    );
    // One pier per bay, and a shadow down the inner edge of each.
    expect(piers).toHaveLength(MASONRY.bays * 2);

    const openings = rects.filter(([, , w]) => w === Math.round(MASONRY.bayPx * 0.5));
    expect(openings.length).toBeGreaterThan(MASONRY.floors);
    for (const [x, , w] of openings) {
      expect.soft(x!).toBeGreaterThanOrEqual(0);
      expect.soft(x! + w!).toBeLessThanOrEqual(MASONRY.width);
    }
  });

  /**
   * A residential or hotel block lights one room at a time, which is the other half of what
   * separates it from an office tower — offices light by the floor plate, in runs. So most
   * openings stay dark, and the lit ones do not queue up along a storey.
   */
  it("lights rooms one at a time rather than by the floor", () => {
    const contexts = record();
    createMasonryTexture();

    const lit = contexts[0]!
      .valuesOf("fillStyle")
      .filter((style) => ROOM_LIGHT.includes(String(style)));
    expect(lit.length).toBeGreaterThan(0);
    expect(lit.length).toBeLessThan(MASONRY.bays * MASONRY.floors * 0.5);
  });

  it("paints the same wall every time", () => {
    const contexts = record();
    createMasonryTexture();
    createMasonryTexture();

    expect(contexts[1]!.transcript).toEqual(contexts[0]!.transcript);
  });
});

describe("ribbon texture", () => {
  it("returns a texture rather than throwing when the browser refuses a context", () => {
    expect(() => createRibbonTexture()).not.toThrow();
    expect(createRibbonTexture().image).toBeInstanceOf(HTMLCanvasElement);
  });

  it("repeats in both axes", () => {
    const texture = createRibbonTexture();

    expect(texture.wrapS).toBe(RepeatWrapping);
    expect(texture.wrapT).toBe(RepeatWrapping);
  });

  /**
   * The ribbon's rhythm is horizontal and nothing else: the glazing runs corner to corner on
   * every storey, and the only verticals on the whole facade are the columns. A band that
   * stopped short of the edge, or a mullion between the bays, would make this a curtain wall
   * with wider spandrels.
   */
  it("runs the glazing corner to corner and breaks it only with columns", () => {
    const contexts = record();
    createRibbonTexture();
    const rects = contexts[0]!.callsTo("fillRect").map((args) => args.map(Number));

    const bands = rects.filter(
      ([, , w, h]) => w === RIBBON.width && h === Math.round(RIBBON.floorPx * 0.46),
    );
    expect(bands).toHaveLength(RIBBON.floors);

    // The base coat is the same height, so a column is one that does not span the whole sheet.
    const columns = rects.filter(
      ([, , w, h]) => h === RIBBON.floors * RIBBON.floorPx && w !== RIBBON.width,
    );
    // A column and its lit edge, every fifth bay — and they are painted after the bands, so
    // each one stands in front of every storey it crosses.
    expect(columns).toHaveLength((RIBBON.bays / 5) * 2);
    expect(rects.indexOf(columns[0]!)).toBeGreaterThan(rects.indexOf(bands.at(-1)!));
  });

  /**
   * A run on a ribbon is the width of the slab, so the cyan an office floor may be lit in
   * lands on forty meters of continuous glazing and reads as a lit tube taped to the building.
   * The curtain wall keeps it; this sheet must not.
   */
  it("keeps the cyan office light off a facade that lights in unbroken lines", () => {
    const contexts = record();
    createRibbonTexture();

    const styles = contexts[0]!.valuesOf("fillStyle").map(String);
    expect(styles).not.toContain(CYAN_OFFICE_LIGHT);
    expect(styles.some((style) => OFFICE_LIGHT.includes(style))).toBe(true);
  });

  it("paints the same slab every time", () => {
    const contexts = record();
    createRibbonTexture();
    createRibbonTexture();

    expect(contexts[1]!.transcript).toEqual(contexts[0]!.transcript);
  });
});

/** The sky sheet: wide enough to carry cloud. The haze only ever needs the ramp. */
const SKY = { width: 384, height: 512 };

describe("sky and haze ramps", () => {
  /**
   * Both are painted onto spheres concentric with the room, so the texture's `v` is latitude
   * and 0.5 is the horizon. The stops are authored in `v` and painted in canvas space, which
   * runs the other way — so they come out descending, and a set that is not monotonic at all
   * puts the light-pollution band somewhere other than the horizon.
   */
  it.each([
    ["sky", createSkyTexture],
    ["haze", createHazeTexture],
  ])("runs the %s ramp zenith to nadir with its stops in order", (_name, make) => {
    const contexts = record();
    make();
    const ramp = contexts[0]!;

    expect(ramp.callsTo("createLinearGradient")[0]).toEqual([0, 0, 0, 512]);
    const offsets = ramp.callsTo("gradient#1.addColorStop").map(([offset]) => Number(offset));
    expect(offsets).toEqual([...offsets].sort((a, b) => b - a));
    expect(offsets.at(0)).toBe(1);
    expect(offsets.at(-1)).toBe(0);
    // The horizon has to be a stop of its own, or the band is an interpolation artifact.
    expect(offsets).toContain(0.5);
  });

  /**
   * No moon and no stars: a metropolis erases both, and nothing here paints one. What the sky
   * does carry is cloud, and the way it is drawn is the property worth holding — one soft
   * vertical gradient per column of the sheet, so a band has an underside and a top and wraps
   * at the seam. A disc or an arc out here would be a moon; a rect wider than a column would
   * be a hard-edged band with a visible end.
   */
  it("paints the sky as vertical ramps and nothing else", () => {
    const contexts = record();
    createSkyTexture();
    const sky = contexts[0]!;

    expect(sky.callsTo("createRadialGradient")).toHaveLength(0);
    expect(sky.callsTo("arc")).toHaveLength(0);

    const rects = sky.callsTo("fillRect").map((args) => args.map(Number));
    // The base coat, then one column per cloud band's width.
    expect(rects[0]).toEqual([0, 0, SKY.width, SKY.height]);
    for (const [, , width] of rects.slice(1)) expect.soft(width).toBe(1);
    expect(rects.length).toBeGreaterThan(SKY.width);

    // Every gradient is vertical: a horizontal one would run cloud along the sheet instead.
    for (const [x0, , x1] of sky.callsTo("createLinearGradient")) expect.soft(x0).toBe(x1);
  });

  /** The haze is a wash the city is seen through, so every stop of it has to carry alpha. */
  it("gives the haze an alpha that peaks at the horizon", () => {
    const contexts = record();
    createHazeTexture();
    const stops = contexts[0]!.callsTo("gradient#1.addColorStop");

    const alphaAt = new Map(
      stops.map(([offset, color]) => [
        Number(offset),
        Number(/rgba\([^)]*,\s*([\d.]+)\)/.exec(String(color))?.[1] ?? NaN),
      ]),
    );
    for (const alpha of alphaAt.values()) expect.soft(alpha).not.toBeNaN();
    // v is flipped into canvas space, so the horizon is the 0.5 stop either way, and the
    // zenith is the stop at 0 — where the haze has to be thin or it fogs the sky itself.
    expect(alphaAt.get(0.5)).toBe(1);
    expect(alphaAt.get(0)).toBeLessThan(0.5);
  });

  it("paints the same sky every time", () => {
    const contexts = record();
    createSkyTexture();
    createSkyTexture();

    expect(contexts[1]!.transcript).toEqual(contexts[0]!.transcript);
  });
});

/**
 * The street sheet: 1024 px square, tiled, three city blocks across — and each block halved
 * again by a service street, so a tile carries six roads each way rather than two.
 */
const STREET = { size: 1024, blocks: 3, roadsEachWay: 6 };

describe("street texture", () => {
  it("returns a texture rather than throwing when the browser refuses a context", () => {
    expect(() => createStreetTexture()).not.toThrow();
    expect(createStreetTexture().image).toBeInstanceOf(HTMLCanvasElement);
  });

  /** It is laid over a square kilometer of ground, so it has to tile in both axes. */
  it("tiles across the ground evenly", () => {
    const texture = createStreetTexture();

    expect(texture.wrapS).toBe(RepeatWrapping);
    expect(texture.wrapT).toBe(RepeatWrapping);
    expect(texture.repeat.x).toBeGreaterThan(1);
    expect(texture.repeat.x).toBe(texture.repeat.y);
    // Minified to nothing from thirty storeys up unless the mip chain is built.
    expect(texture.generateMipmaps).toBe(true);
  });

  /**
   * The roadway is what carries the grid at distance — a lamp is well under a texel from up
   * there, so a street painted only as lamps averages out of the mip chain entirely.
   *
   * But it must not be the roadway painted sodium kerb to kerb either, which is what the first
   * version of that reasoning produced: a tan ribbon a block wide, flat across, reading as
   * carpet laid between the towers. Light on a street comes from two rows of lamps standing at
   * its edges, so each road is laid three times — the asphalt, then an apron under each kerb —
   * and the aprons together are a minority of its width. That cross-section is what makes it a
   * street, and it averages to the same value in the mip chain either way.
   */
  it("lights every roadway from its kerbs rather than across its whole width", () => {
    const contexts = record();
    createStreetTexture();
    const sheet = contexts[0]!;

    const full = sheet
      .callsTo("fillRect")
      .map((args) => args.map(Number))
      .filter(([, , w, h]) => (w === STREET.size) !== (h === STREET.size));
    // Asphalt plus two aprons, on every road running each way.
    expect(full).toHaveLength(STREET.roadsEachWay * 2 * 3);

    // Read the roads running one way: the tarmac is the widest rect starting at its own kerb,
    // and the two aprons are the rects that sit inside it.
    const down = full
      .filter(([, , , h]) => h === STREET.size)
      .map(([x, , w]) => ({ from: x!, to: x! + w!, width: w! }));
    const tarmac = down.filter(
      (rect) =>
        !down.some(
          (other) => other.width > rect.width && other.from <= rect.from && other.to >= rect.to,
        ),
    );
    expect(tarmac).toHaveLength(STREET.roadsEachWay);

    for (const road of tarmac) {
      const aprons = down.filter(
        (rect) => rect !== road && rect.from >= road.from && rect.to <= road.to,
      );
      expect.soft(aprons).toHaveLength(2);
      // Both kerbs are lit and the crown of the road is not, which is the cross-section.
      const lit = aprons.reduce((total, apron) => total + apron.width, 0);
      expect.soft(lit / road.width).toBeLessThan(0.5);
      expect.soft(lit).toBeGreaterThan(0);
    }

    const washes = sheet.valuesOf("globalAlpha").map(Number);
    expect(washes.some((alpha) => alpha > 0.4)).toBe(true);
    expect(washes.at(-1)).toBe(1);
  });

  it("paints the same streets every time", () => {
    const contexts = record();
    createStreetTexture();
    createStreetTexture();

    expect(contexts[1]!.transcript).toEqual(contexts[0]!.transcript);
  });
});

describe("keyboard legend texture", () => {
  const labeled = KEYCAPS.filter((cap) => cap.label);
  const width = Math.round(KEY_FIELD_WIDTH * PIXELS_PER_METER);
  const height = Math.round(KEY_FIELD_DEPTH * PIXELS_PER_METER);

  it("returns a texture when the browser refuses a context", () => {
    const { result } = renderHook(() => useKeyboardLegendTexture());

    expect(result.current.image).toBeInstanceOf(HTMLCanvasElement);
  });

  it("prints one legend per labeled keycap and nothing on the blank ones", () => {
    const contexts = record();
    renderHook(() => useKeyboardLegendTexture());
    const legend = contexts[0]!;

    // The spacebar carries no label; printing "" on it would still count as a run.
    expect(legend.text).toEqual(labeled.map((cap) => cap.label));
    expect(legend.text.length).toBeLessThan(KEYCAPS.length);
  });

  it("centers each legend on the keycap it belongs to", () => {
    const contexts = record();
    renderHook(() => useKeyboardLegendTexture());
    const legend = contexts[0]!;

    for (const [index, cap] of labeled.entries()) {
      const run = legend.runs[index]!;
      expect.soft(run.x).toBeCloseTo((cap.x + KEY_FIELD_WIDTH / 2) * PIXELS_PER_METER, 6);
      expect.soft(run.y).toBeCloseTo((cap.z + KEY_FIELD_DEPTH / 2) * PIXELS_PER_METER, 6);
      expect.soft(run.align).toBe("center");
      expect.soft(run.baseline).toBe("middle");
    }
  });

  it("shrinks a word so it fits the cap, and keeps every legend on the texture", () => {
    const contexts = record();
    renderHook(() => useKeyboardLegendTexture());
    const legend = contexts[0]!;

    const sizeOf = (font: string): number => Number(/^(\d+(?:\.\d+)?)px/.exec(font)?.[1]);
    const short = legend.runs.find((run) => run.text === "Q")!;
    const long = legend.runs.find((run) => run.text === "shift")!;

    expect(sizeOf(long.font)).toBeLessThan(sizeOf(short.font));
    for (const run of legend.runs) {
      expect.soft(run.x - run.width / 2, `"${run.text}" runs off the left`).toBeGreaterThan(0);
      expect.soft(run.x + run.width / 2, `"${run.text}" runs off the right`).toBeLessThan(width);
      expect.soft(run.y).toBeGreaterThan(0);
      expect.soft(run.y).toBeLessThan(height);
    }
  });

  it("paints once and hands back the same texture on a rerender", () => {
    const contexts = record();
    const { result, rerender } = renderHook(() => useKeyboardLegendTexture());
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
    expect(contexts).toHaveLength(1);
  });

  it("releases the texture when the scene unmounts", () => {
    const { result, unmount } = renderHook(() => useKeyboardLegendTexture());
    const dispose = vi.spyOn(result.current, "dispose");

    unmount();

    expect(dispose).toHaveBeenCalledOnce();
  });
});

/**
 * The bookshelf's atlas. A shelf is one mesh reading one texture, so every spine's art has to
 * stay inside its own cell — art that spills prints a neighbor's ink on the sides of the
 * book beside it, and the shelf renders perfectly either way. The transcript is the only
 * place that is visible, because jsdom has no pixels.
 */
describe("book atlas texture", () => {
  const books = SHELF_BOOKS.slice(0, 12);
  const layout = bookAtlasLayout(books);

  function paint(row: readonly BookPlacement[] = books): RecordingContext {
    const recording = createRecordingContext({ width: layout.width, height: layout.height });
    paintBookAtlas(recording.ctx, row);
    return recording;
  }

  it("returns a texture rather than throwing when the browser refuses a context", () => {
    expect(() => createBookAtlasTexture(books)).not.toThrow();
    expect(createBookAtlasTexture(books).image).toBeInstanceOf(HTMLCanvasElement);
  });

  /**
   * Mipmaps are the one thing this texture needs that `createCanvasTexture` does not give
   * it: a shelf is painted once and then read minified and at a glancing angle, where an
   * unfiltered band edge crawls on every camera move.
   */
  it("mipmaps and filters the atlas, unlike the screens it shares a factory with", () => {
    const texture = createBookAtlasTexture(books);

    expect(texture.generateMipmaps).toBe(true);
    expect(texture.anisotropy).toBeGreaterThan(1);
  });

  it("floods each cell with its own cloth before anything is printed on it", () => {
    const atlas = paint();
    const floods = atlas
      .callsTo("fillRect")
      .filter(([, , width, height]) => width === BOOK_CELL.width && height === BOOK_CELL.height);

    expect(floods).toHaveLength(books.length);
    expect(floods.map(([x, y]) => [Number(x), Number(y)])).toEqual(
      books.map((_, index) => [
        (index % layout.columns) * BOOK_CELL.width,
        Math.floor(index / layout.columns) * BOOK_CELL.height,
      ]),
    );
    expect(new Set(books.map((book) => book.design.cloth.cloth)).size).toBeGreaterThan(1);
  });

  /**
   * Every spine, including the thin ones — a narrow book is set as one line up its length
   * rather than left blank, which is what the two-line layout gives on a 15-pixel spine.
   */
  it("letters every spine with its own title", () => {
    const atlas = paint();

    expect(atlas.text.join(" ")).toBe(books.map((book) => book.design.title.join(" ")).join(" "));
    // Every one of them printed in that book's ink, which is what a title is set in.
    const inks = new Set(books.map((book) => book.design.cloth.ink));
    for (const run of atlas.runs) expect.soft(inks).toContain(run.style);
  });

  /**
   * A shelf lettered all one way reads as generated. Turning every title would always fit
   * more — a spine is the long direction — so a spine wide enough to read across is set that
   * way instead. The two books differ only in thickness, which is the whole of the rule.
   */
  it("letters a wide spine across it and a narrow one up it", () => {
    const wide = { ...books[0]!, size: [0.14, 0.38, 0.076] as const, design: bookDesign(0) };
    const narrow = { ...wide, size: [0.14, 0.38, 0.026] as const };

    const recording = createRecordingContext({ width: 200, height: 600 });
    paintBookAtlas(recording.ctx, [wide, narrow]);

    // A turned title is painted inside a rotated frame, so it is drawn at that frame's origin.
    const [acrossRun, upRun] = [recording.runs[0]!, recording.runs.at(-1)!];
    expect(acrossRun.x).not.toBe(0);
    expect(upRun.x).toBe(0);
    expect(recording.callsTo("rotate")).toEqual([[-Math.PI / 2]]);
    expect(recording.callsTo("translate")).toHaveLength(1);
  });

  /**
   * The defect that is invisible in a screenshot and wrong on every shelf: one book's rules,
   * page block or emblem painted over the cell the book beside it reads from.
   */
  it("keeps every mark inside the cell of the book it belongs to", () => {
    const atlas = paint();
    const bounds = books.map((book, index) => {
      const rects = bookCellRects(index, layout, book);
      return { rects, index };
    });

    let cursor = -1;
    for (const call of atlas.callsTo("fillRect")) {
      const [x, y, width, height] = call.map(Number);
      if (width === BOOK_CELL.width && height === BOOK_CELL.height) {
        cursor += 1;
        continue;
      }
      const cell = bounds[cursor]!;
      const left = (cell.index % layout.columns) * BOOK_CELL.width;
      const top = Math.floor(cell.index / layout.columns) * BOOK_CELL.height;

      expect.soft(x!, `book ${cell.index} paints left of its cell`).toBeGreaterThanOrEqual(left);
      expect.soft(y!).toBeGreaterThanOrEqual(top);
      expect.soft(x! + width!).toBeLessThanOrEqual(left + BOOK_CELL.width);
      expect.soft(y! + height!).toBeLessThanOrEqual(top + BOOK_CELL.height);
    }
    expect(cursor).toBe(books.length - 1);

    // The publisher's marks are paths rather than rects, and land inside the atlas too.
    for (const point of atlas.paths.flatMap((path) => path.points)) {
      expect.soft(point[0]).toBeGreaterThanOrEqual(0);
      expect.soft(point[0]).toBeLessThanOrEqual(layout.width);
      expect.soft(point[1]).toBeGreaterThanOrEqual(0);
      expect.soft(point[1]).toBeLessThanOrEqual(layout.height);
    }
  });

  it("paints the same shelf every time", () => {
    // Two contexts rather than two passes: the stub numbers its gradient handles globally.
    expect(paint().transcript).toEqual(paint().transcript);
  });
});

describe("the soundbar's perforation", () => {
  function paint(): RecordingContext {
    const contexts = record();
    createPerforationTexture();
    return contexts[0]!;
  }

  it("fills the tile with a staggered field rather than a grid", () => {
    const rows = paint()
      .callsTo("arc")
      .map(([x, y]) => ({ x: Number(x), y: Number(y) }));

    // Row spacing is the pitch and column spacing is the pitch, so a field this size is 64
    // holes — but the two phases are what make it read as perforation instead of graph paper.
    expect(rows.length).toBeGreaterThanOrEqual(PERFORATION_HOLES ** 2);
    const phases = new Set(rows.map((hole) => ((hole.x % PERFORATION_PITCH) + 16) % 16));
    expect(phases.size).toBe(2);
  });

  /**
   * The tile repeats across the wrap, so a hole the stagger pushes onto its edge has to be
   * painted at both edges. Left half-drawn it is a column of half-holes every 24 mm running
   * the length of the bar — which is a seam, and the one defect this texture can have that a
   * uniform field is otherwise immune to.
   */
  it("paints a hole that lands on the seam at both edges of the tile", () => {
    const xs = paint()
      .callsTo("arc")
      .map(([x]) => Number(x));

    expect(xs).toContain(0);
    expect(xs).toContain(PERFORATION_TILE);
  });

  it("hands the context back with a hole gradient rather than a flat fill", () => {
    const gradients = paint().callsTo("createRadialGradient");

    // Inner radius, then outer: a hole drawn from the outside in is a stud, not a hole.
    for (const [, , inner, , , outer] of gradients.slice(0, 8)) {
      expect.soft(Number(inner)).toBeLessThan(Number(outer));
    }
  });
});

describe("the remote's face", () => {
  function paint(): RecordingContext {
    const contexts = record();
    createRemoteFaceTexture();
    return contexts[0]!;
  }

  /**
   * The layout is written in millimeters from the top of a 35 × 136 mm face, and the canvas is
   * pixels — so the one thing that can go wrong silently is a scale that puts a key off the
   * panel, where it is simply never seen.
   */
  it("keeps the clickpad and every key inside the face", () => {
    const face = paint();

    for (const [x, y, radius] of face.callsTo("arc")) {
      expect.soft(Number(x) - Number(radius)).toBeGreaterThanOrEqual(0);
      expect.soft(Number(x) + Number(radius)).toBeLessThanOrEqual(REMOTE_PRINT.width);
      expect.soft(Number(y) - Number(radius)).toBeGreaterThanOrEqual(0);
      expect.soft(Number(y) + Number(radius)).toBeLessThanOrEqual(REMOTE_PRINT.height);
    }
  });

  it("prints a clickpad above three ranks of keys, which is what says remote", () => {
    const circles = paint()
      .callsTo("arc")
      .map(([x, y, radius]) => ({ x: Number(x), y: Number(y), radius: Number(radius) }));

    const pad = circles.reduce((widest, circle) =>
      circle.radius > widest.radius ? circle : widest,
    );
    // Grouped by radius rather than picked by size: the glyph inside a key is a circle too,
    // and so is the ring around the pad's own center button, so "small" catches four things
    // that are not keys. The six drawn alike are the field.
    const sizes = new Map<number, { x: number; y: number }[]>();
    for (const circle of circles) {
      sizes.set(circle.radius, [...(sizes.get(circle.radius) ?? []), circle]);
    }
    const keys = [...sizes.values()].find((group) => group.length === REMOTE_KEYS);
    if (!keys) throw new Error("The remote prints no rank of keys");

    // Two columns, one rank above the pad and three below it.
    expect(new Set(keys.map((key) => key.x)).size).toBe(2);
    expect(keys.filter((key) => key.y < pad.y)).toHaveLength(2);
    expect(keys.filter((key) => key.y > pad.y)).toHaveLength(REMOTE_KEYS - 2);
  });
});

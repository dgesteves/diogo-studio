import { describe, expect, it } from "vitest";

import { createRecordingContext, type RecordingContext } from "@tests/recording-ctx";

import { CELL_GAP, DISTURB_RADIUS_RATIO, TINT, type Pointer } from "./portrait-engine";
import { drawPortraitFrame } from "./portrait-engine";
import type { Cell, Dims } from "./portrait-engine";

/**
 * One frame of the portrait. The engine calls this on every animation frame and stops when
 * it returns `false`, so the return value is the battery contract: a portrait nobody is
 * pointing at, with motion turned off, must settle rather than spin forever.
 */

const DIMS: Dims = { width: 100, height: 100, cellW: 10, cellH: 10, dpr: 2 };

function makeCell(x: number, y: number, overrides: Partial<Cell> = {}): Cell {
  return {
    bx: x * DIMS.cellW,
    by: y * DIMS.cellH,
    r: 10,
    g: 20,
    b: 30,
    a: 1,
    ox: 0,
    oy: 0,
    vx: 0,
    vy: 0,
    phase: 0,
    ...overrides,
  };
}

const IDLE: Pointer = { x: 0, y: 0, active: false };

function draw(
  cells: Cell[],
  { pointer = IDLE, interactive = true, time = 0 } = {},
): { recording: RecordingContext; again: boolean } {
  const recording = createRecordingContext({ width: DIMS.width, height: DIMS.height });
  const again = drawPortraitFrame(recording.ctx, {
    cells,
    dims: DIMS,
    pointer,
    interactive,
    time,
  });
  return { recording, again };
}

describe("drawPortraitFrame", () => {
  it("scales to the device pixel ratio and clears the previous frame", () => {
    const { recording } = draw([makeCell(0, 0)]);

    expect(recording.transcript.slice(0, 2)).toEqual([
      "setTransform(2, 0, 0, 2, 0, 0)",
      "clearRect(0, 0, 100, 100)",
    ]);
  });

  it("paints one cell per sample, inset by the gap so the grid reads as pixels", () => {
    const cells = [makeCell(0, 0), makeCell(1, 0)];

    // At rest: with motion on, the ambient drift has already displaced the grid by frame one.
    const { recording } = draw(cells, { interactive: false });

    expect(recording.callsTo("fillRect")).toEqual([
      [0, 0, DIMS.cellW - CELL_GAP, DIMS.cellH - CELL_GAP],
      [10, 0, DIMS.cellW - CELL_GAP, DIMS.cellH - CELL_GAP],
    ]);
    expect(recording.valuesOf("fillStyle")).toEqual(["rgb(10,20,30)", "rgb(10,20,30)"]);
  });

  it("carries each sample's transparency through to the canvas", () => {
    const { recording } = draw([makeCell(0, 0, { a: 0.25 })]);

    expect(recording.valuesOf("globalAlpha")).toEqual([0.25, 1]);
  });

  it("settles instead of animating forever when nothing is happening", () => {
    const cell = makeCell(0, 0);

    const { again, recording } = draw([cell], { interactive: false });

    expect(again).toBe(false);
    expect(cell.ox).toBe(0);
    expect(cell.oy).toBe(0);
    expect(recording.callsTo("fillRect")[0]).toEqual([0, 0, 9, 9]);
  });

  it("keeps animating while motion is allowed, and drifts the cells as time passes", () => {
    const cell = makeCell(0, 0, { phase: 1 });

    const { again } = draw([cell], { time: 5000 });

    expect(again).toBe(true);
    expect(cell.ox).not.toBe(0);
    expect(cell.oy).not.toBe(0);
  });

  it("keeps animating for a pointer even when motion is off", () => {
    const pointer: Pointer = { x: 5, y: 5, active: true };

    const { again } = draw([makeCell(0, 0)], { pointer, interactive: false });

    expect(again).toBe(true);
  });

  it("pushes a cell away from the pointer and tints it toward the accent", () => {
    // The pointer sits left of a cell centered at (55, 55), inside the disturb radius.
    const cell = makeCell(5, 5);
    const pointer: Pointer = { x: 30, y: 55, active: true };

    const { recording } = draw([cell], { pointer, interactive: false });

    expect(cell.vx).toBeGreaterThan(0);
    expect(cell.ox).toBeGreaterThan(0);
    const [style] = recording.valuesOf("fillStyle");
    expect(style).not.toBe("rgb(10,20,30)");
    // Toward the accent on every channel, never past it.
    const [r, g, b] = String(style).match(/\d+/g)?.map(Number) ?? [];
    expect(r).toBeGreaterThanOrEqual(10);
    expect(g).toBeGreaterThan(20);
    expect(b).toBeGreaterThan(30);
    expect(g).toBeLessThanOrEqual(TINT.g);
    expect(b).toBeLessThanOrEqual(TINT.b);
  });

  it("leaves a cell outside the disturb radius alone", () => {
    const radius = Math.min(DIMS.width, DIMS.height) * DISTURB_RADIUS_RATIO;
    const cell = makeCell(9, 9);
    const pointer: Pointer = { x: 0, y: 0, active: true };

    const { recording } = draw([cell], { pointer, interactive: false });

    expect(Math.hypot(cell.bx + DIMS.cellW / 2, cell.by + DIMS.cellH / 2)).toBeGreaterThan(radius);
    expect(recording.valuesOf("fillStyle")).toEqual(["rgb(10,20,30)"]);
    expect(cell.vx).toBe(0);
  });

  it("survives a pointer exactly on a cell's center rather than dividing by zero", () => {
    const cell = makeCell(0, 0);
    const pointer: Pointer = { x: 5, y: 5, active: true };

    const { recording } = draw([cell], { pointer, interactive: false });

    expect(Number.isFinite(cell.ox)).toBe(true);
    expect(Number.isFinite(cell.oy)).toBe(true);
    expect(recording.callsTo("fillRect")[0]?.every(Number.isFinite)).toBe(true);
  });

  it("draws nothing at all for an empty grid, and says so", () => {
    const { again, recording } = draw([], { interactive: false });

    expect(again).toBe(false);
    expect(recording.callsTo("fillRect")).toHaveLength(0);
  });
});

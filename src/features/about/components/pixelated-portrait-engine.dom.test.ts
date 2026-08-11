import { afterEach, describe, expect, it, vi } from "vitest";

import { restoreMediaStubs } from "@tests/media";
import { stubCanvasContexts } from "@tests/recording-ctx";

import { createPortraitEngine } from "./pixelated-portrait-engine";
import { sampleGrid } from "./pixelated-portrait-sampler";

/**
 * The engine behind the About portrait: it samples an image into a grid of cells and
 * animates them. Everything it touches is a browser API jsdom either lacks or cannot
 * rasterize, so each one is stubbed here — but the two properties worth the setup are
 * product behavior, not plumbing: it must do nothing at all without a 2D context, and it
 * must bind no pointer listeners when motion is off, which is how a reduced-motion visitor
 * reaches it.
 */

const RECT = { width: 100, height: 125 };
const CELL_SIZE = 25;

type Listener = (entries: unknown[]) => void;

const observers: { resize: Listener[]; visibility: Listener[] } = { resize: [], visibility: [] };
const images: StubImage[] = [];
const frames: { id: number; callback: FrameRequestCallback }[] = [];
let nextFrame = 0;

class StubImage {
  // Deliberately wider than the 4:5 frame: with a matching aspect ratio, cropping and
  // letterboxing produce identical arguments and the crop test cannot fail.
  width = 300;
  height = 250;
  decoding = "";
  src = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    images.push(this);
  }
}

function stubEnvironment(): void {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: Listener) {
        observers.resize.push(callback);
      }
      observe(): void {}
      disconnect(): void {
        observers.resize = observers.resize.filter((entry) => entry !== undefined);
      }
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: Listener) {
        observers.visibility.push(callback);
      }
      observe(): void {}
      disconnect(): void {}
    },
  );
  vi.stubGlobal("Image", StubImage);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    nextFrame += 1;
    frames.push({ id: nextFrame, callback });
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    const index = frames.findIndex((frame) => frame.id === id);
    if (index >= 0) frames.splice(index, 1);
  });
}

function runFrames(time = 0): number {
  const pending = frames.splice(0, frames.length);
  for (const frame of pending) frame.callback(time);
  return pending.length;
}

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = (): DOMRect =>
    ({ ...RECT, top: 0, left: 0, right: RECT.width, bottom: RECT.height, x: 0, y: 0 }) as DOMRect;
  document.body.append(canvas);
  return canvas;
}

afterEach(() => {
  observers.resize = [];
  observers.visibility = [];
  images.length = 0;
  frames.length = 0;
  vi.unstubAllGlobals();
  // Not `unstubAllGlobals` alone: it drops the setup file's matchMedia for every later test.
  restoreMediaStubs();
});

describe("createPortraitEngine without a 2D context", () => {
  it("does nothing, and hands back a cleanup that is safe to call", () => {
    stubEnvironment();
    const canvas = makeCanvas();
    const listeners = vi.spyOn(canvas, "addEventListener");
    const onLoaded = vi.fn();

    // jsdom's own answer, and the browser's when a context cannot be created.
    const dispose = createPortraitEngine(canvas, {
      src: "/portrait.png",
      cellSize: CELL_SIZE,
      interactive: true,
      onLoaded,
    });

    expect(observers.resize).toHaveLength(0);
    expect(observers.visibility).toHaveLength(0);
    expect(images).toHaveLength(0);
    expect(listeners).not.toHaveBeenCalled();
    expect(onLoaded).not.toHaveBeenCalled();
    expect(() => dispose()).not.toThrow();
  });
});

describe("createPortraitEngine", () => {
  function start(interactive: boolean, onLoaded = vi.fn(), onError = vi.fn()) {
    stubEnvironment();
    const canvas = makeCanvas();
    const canvases = stubCanvasContexts({ pixel: () => [12, 34, 56, 128] });
    const dispose = createPortraitEngine(canvas, {
      src: "/portrait.png",
      cellSize: CELL_SIZE,
      interactive,
      onLoaded,
      onError,
    });
    return { canvas, canvases, dispose, onLoaded, onError };
  }

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = (): null => null;
  });

  it("waits for the image before it draws anything", () => {
    const { canvases, onLoaded } = start(true);

    expect(onLoaded).not.toHaveBeenCalled();
    expect(canvases.contexts[0]?.callsTo("fillRect")).toHaveLength(0);
  });

  it("samples the image into a grid and paints a cell for each sample", () => {
    const { canvases, onLoaded } = start(true);

    images[0]?.onload?.();
    runFrames();

    expect(onLoaded).toHaveBeenCalledOnce();
    // 100×125 at a 25px cell is 4 columns by 5 rows.
    const painted = canvases.contexts[0]?.callsTo("fillRect") ?? [];
    expect(painted).toHaveLength(20);
    expect(canvases.contexts[0]?.valuesOf("fillStyle")).toContain("rgb(12,34,56)");
  });

  it("reports a portrait that fails to load, so the placeholder can stay", () => {
    const { onError, onLoaded } = start(true);

    images[0]?.onerror?.();

    expect(onError).toHaveBeenCalledOnce();
    expect(onLoaded).not.toHaveBeenCalled();
  });

  it("binds no pointer listeners when motion is off", () => {
    stubEnvironment();
    const canvas = makeCanvas();
    const listeners = vi.spyOn(canvas, "addEventListener");
    stubCanvasContexts();

    createPortraitEngine(canvas, { src: "/p.png", cellSize: CELL_SIZE, interactive: false });

    expect(listeners.mock.calls.map(([type]) => type)).toEqual([]);
  });

  it("follows the pointer when motion is on", () => {
    const { canvas } = start(true);
    images[0]?.onload?.();
    runFrames();

    canvas.dispatchEvent(new PointerEvent("pointermove", { clientX: 50, clientY: 60 }));

    // A pointer move schedules a frame even after the idle loop has stopped.
    expect(runFrames()).toBeGreaterThan(0);
  });

  it("stops drawing once the portrait scrolls out of view, and resumes when it returns", () => {
    start(true);
    images[0]?.onload?.();
    runFrames();

    observers.visibility[0]?.([{ isIntersecting: false }]);
    runFrames();
    expect(frames).toHaveLength(0);

    observers.visibility[0]?.([{ isIntersecting: true }]);
    expect(frames.length).toBeGreaterThan(0);
  });

  it("re-samples when the frame is resized, because the grid depends on its size", () => {
    const { canvases } = start(true);
    images[0]?.onload?.();
    runFrames();
    const before = canvases.contexts.length;

    observers.resize[0]?.([]);

    // A resize builds a fresh sampling canvas rather than stretching the old grid.
    expect(canvases.contexts.length).toBeGreaterThan(before);
  });

  it("lets go of everything it attached when the portrait unmounts", () => {
    const { canvas, dispose } = start(true);
    const removed = vi.spyOn(canvas, "removeEventListener");
    images[0]?.onload?.();
    runFrames();
    canvas.dispatchEvent(new PointerEvent("pointermove", { clientX: 10, clientY: 10 }));

    dispose();

    expect(removed.mock.calls.map(([type]) => type)).toEqual(["pointermove", "pointerleave"]);
    expect(frames).toHaveLength(0);
    expect(images[0]?.onload).toBeNull();
    expect(images[0]?.onerror).toBeNull();
  });
});

describe("sampleGrid", () => {
  it("reports nothing for a frame with no size, rather than a grid of zero cells", () => {
    stubEnvironment();
    stubCanvasContexts();
    const canvas = document.createElement("canvas");
    canvas.getBoundingClientRect = (): DOMRect => ({ width: 0, height: 0 }) as DOMRect;

    expect(sampleGrid(canvas, new Image(), CELL_SIZE)).toBeNull();
  });

  it("always produces at least one cell, however small the frame", () => {
    stubEnvironment();
    stubCanvasContexts();
    const canvas = makeCanvas();
    canvas.getBoundingClientRect = (): DOMRect => ({ width: 4, height: 4 }) as DOMRect;

    const result = sampleGrid(canvas, new Image(), CELL_SIZE);

    expect(result?.cells).toHaveLength(1);
    expect(result?.dims).toMatchObject({ width: 4, height: 4, cellW: 4, cellH: 4 });
  });

  it("sizes the backing store to the device pixel ratio, capped at 2", () => {
    stubEnvironment();
    stubCanvasContexts();
    vi.stubGlobal("devicePixelRatio", 3);
    const canvas = makeCanvas();

    const result = sampleGrid(canvas, new Image(), CELL_SIZE);

    expect(result?.dims.dpr).toBe(2);
    expect(canvas.width).toBe(RECT.width * 2);
    expect(canvas.height).toBe(RECT.height * 2);
  });

  it("gives every cell the color under it and a phase that varies across the grid", () => {
    stubEnvironment();
    stubCanvasContexts({ pixel: (x, y) => [x, y, 0, 255] });
    const canvas = makeCanvas();

    const result = sampleGrid(canvas, new Image(), CELL_SIZE);

    expect(result?.cells[0]).toMatchObject({ bx: 0, by: 0, r: 0, g: 0, b: 0, a: 1, phase: 0 });
    // Column 1, row 0 — the sampler reads left to right, top to bottom.
    expect(result?.cells[1]).toMatchObject({ bx: 25, by: 0, r: 1, g: 0 });
    expect(new Set(result?.cells.map((cell) => cell.phase)).size).toBeGreaterThan(1);
  });

  it("crops the image to the frame rather than squashing or letterboxing it", () => {
    stubEnvironment();
    const canvases = stubCanvasContexts();
    const canvas = makeCanvas();

    sampleGrid(canvas, new Image(), CELL_SIZE);

    // A 300×250 image into a 4×5 grid: the full height is used and 50px is taken off each
    // side, so the portrait fills the frame and stays in proportion.
    const sampler = canvases.contexts.at(-1);
    expect(sampler?.callsTo("drawImage")[0]).toEqual([
      expect.anything(),
      50,
      0,
      200,
      250,
      0,
      0,
      4,
      5,
    ]);
  });
});

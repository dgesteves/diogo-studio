import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";

import { createCityFacadeTexture, createSkyTexture } from "./city-textures";
import { KEYCAPS, KEY_FIELD_DEPTH, KEY_FIELD_WIDTH } from "./keyboard-layout";
import { useKeyboardLegendTexture } from "./keyboard-legend";
import { createGlowTexture, createMoonTexture } from "./moon-textures";

/**
 * The canvas textures the scene paints for itself: the lit windows on the city towers, the
 * sky behind them, the moon above, and the legends on the keycaps. Each builds its own
 * canvas through `createCanvasTexture`, so none of them can be handed a context — the
 * recording stub answers `getContext` for the whole prototype instead.
 *
 * Two properties are worth the setup on all of them. They are seeded, so what a visitor
 * sees is the same on every load and reviewable here at all; and a browser that refuses a
 * 2D context must still get a texture back, because the alternative is the scene throwing
 * on mount rather than rendering an unpainted tower.
 */

const FACADE = { width: 128, height: 256 };
const PIXELS_PER_METER = 1500;
const LIT_WINDOW_COLORS = ["#22d3ee", "#67e8f9", "#7dd3fc", "#fbbf24", "#f6efe1"];

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

function record(): readonly RecordingContext[] {
  stub = stubCanvasContexts();
  return stub.contexts;
}

afterEach(() => {
  stub?.restore();
  stub = undefined;
});

/** The rectangles a facade paints after its base coat: one per lit window. */
function windows(recording: RecordingContext): readonly (readonly number[])[] {
  return recording
    .callsTo("fillRect")
    .map((args) => args.map(Number))
    .filter(([, , w, h]) => w !== FACADE.width || h !== FACADE.height);
}

describe("city facade texture", () => {
  it("returns a texture rather than throwing when the browser refuses a context", () => {
    // jsdom's own answer, and a real browser's once too many contexts are live.
    expect(() => createCityFacadeTexture(100)).not.toThrow();
    expect(createCityFacadeTexture(100).image).toBeInstanceOf(HTMLCanvasElement);
  });

  it("lights some of the windows and leaves the rest dark", () => {
    const contexts = record();
    createCityFacadeTexture(100);

    const lit = windows(contexts[0]!);
    // 5 columns × 18 rows, each skipped a little over a quarter of the time. A tower with
    // every window lit, or none, is a different building.
    expect(lit.length).toBeGreaterThan(40);
    expect(lit.length).toBeLessThan(90);
  });

  it("keeps every window inside the facade and in the lit palette", () => {
    const contexts = record();
    createCityFacadeTexture(100);
    const facade = contexts[0]!;

    for (const [x, y, w, h] of windows(facade)) {
      expect.soft(x!).toBeGreaterThanOrEqual(0);
      expect.soft(y!).toBeGreaterThanOrEqual(0);
      expect.soft(x! + w!).toBeLessThanOrEqual(FACADE.width);
      expect.soft(y! + h!).toBeLessThanOrEqual(FACADE.height);
    }
    for (const style of facade.valuesOf("fillStyle").slice(1)) {
      expect.soft(LIT_WINDOW_COLORS).toContain(style);
    }
  });

  it("varies the brightness per window and hands the context back opaque", () => {
    const contexts = record();
    createCityFacadeTexture(100);

    const alphas = contexts[0]!.valuesOf("globalAlpha").map(Number);
    expect(new Set(alphas.slice(0, -1)).size).toBeGreaterThan(1);
    for (const alpha of alphas) expect.soft(alpha).toBeLessThanOrEqual(1);
    // The last write resets it. A facade that leaves alpha down tints everything the scene
    // paints onto a canvas afterwards.
    expect(alphas.at(-1)).toBe(1);
  });

  it("paints the same tower for a seed and a different one per variant", () => {
    const contexts = record();
    createCityFacadeTexture(100);
    createCityFacadeTexture(100);
    createCityFacadeTexture(101);

    expect(contexts[1]!.transcript).toEqual(contexts[0]!.transcript);
    expect(contexts[2]!.transcript).not.toEqual(contexts[0]!.transcript);
  });
});

describe("sky texture", () => {
  it("runs the horizon gradient top to bottom with its stops in order", () => {
    const contexts = record();
    createSkyTexture();
    const sky = contexts[0]!;

    expect(sky.callsTo("createLinearGradient")[0]).toEqual([0, 0, 0, 256]);
    const offsets = sky.callsTo("gradient#1.addColorStop").map(([offset]) => Number(offset));
    // Out of order, the band that reads as a horizon lands somewhere else entirely.
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    expect(offsets.at(0)).toBe(0);
    expect(offsets.at(-1)).toBe(1);
  });

  it("scatters the stars above the horizon and nowhere else", () => {
    const contexts = record();
    createSkyTexture();
    const sky = contexts[0]!;

    const stars = sky.callsTo("fillRect").filter(([, , w, h]) => w === 1 && h === 1);
    expect(stars).toHaveLength(90);
    for (const [x, y] of stars) {
      expect.soft(Number(x)).toBeLessThan(64);
      // Below 110 the gradient is already daylit; a star there reads as a dead pixel.
      expect.soft(Number(y)).toBeLessThan(110);
    }
    expect(sky.valuesOf("globalAlpha").at(-1)).toBe(1);
  });

  it("paints the same sky every time", () => {
    const contexts = record();
    createSkyTexture();
    createSkyTexture();

    expect(contexts[1]!.transcript).toEqual(contexts[0]!.transcript);
  });
});

describe("moon textures", () => {
  it("fades the glow to nothing before it reaches the edge of its quad", () => {
    const contexts = record();
    createGlowTexture();
    const glow = contexts[0]!;

    expect(glow.callsTo("createRadialGradient")[0]).toEqual([64, 64, 0, 64, 64, 64]);
    const stops = glow.callsTo("gradient#1.addColorStop");
    // The last stop has to be fully transparent, or the glow paints a visible square.
    expect(String(stops.at(-1)?.[1])).toMatch(/,\s*0\)$/);
    expect(stops.at(-1)?.[0]).toBe(1);
  });

  it("mottles the moon with maria and craters, all of them on the disc", () => {
    const contexts = record();
    createMoonTexture();
    const moon = contexts[0]!;

    expect(moon.callsTo("createRadialGradient")).toHaveLength(8);
    const craters = moon.callsTo("arc").map((args) => args.map(Number));
    expect(craters).toHaveLength(24);
    for (const [x, y, r] of craters) {
      expect.soft(x!).toBeGreaterThanOrEqual(0);
      expect.soft(x!).toBeLessThanOrEqual(128);
      expect.soft(y!).toBeGreaterThanOrEqual(0);
      expect.soft(y!).toBeLessThanOrEqual(128);
      expect.soft(r!).toBeGreaterThan(0);
    }
  });

  it("paints the same moon every time", () => {
    const contexts = record();
    createMoonTexture();
    createMoonTexture();

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

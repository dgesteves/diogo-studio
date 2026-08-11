import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { LinearFilter, SRGBColorSpace, type CanvasTexture } from "three";

import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";

import { createCanvasTexture } from "./canvas-texture";
import { useLeftScreenTexture } from "./code-screen";
import { useCenterScreenTexture } from "./terminal-screen";
import { FOCUS_POOL } from "./terminal-screen-data";

/**
 * The four desk screens are a canvas each, repainted on a clock and re-uploaded to the GPU.
 * `screen-draw.test.ts` owns what every routine paints; this file owns the clocks and the
 * textures behind them — how often each screen repaints, what it repaints with, and whether
 * it lets go of the canvas when the world unmounts.
 *
 * The two frame-driven screens live in `frames.dom.test.tsx`, because `useFrame` needs a
 * renderer and these two need only fake timers.
 */

const CARET_MS = 600;
const TERMINAL_TICK_MS = 1000;

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

function record(): readonly RecordingContext[] {
  stub = stubCanvasContexts();
  return stub.contexts;
}

/** One interval at a time: several inside one `act` batch into a single repaint. */
function ticks(count: number, ms: number): void {
  for (let index = 0; index < count; index += 1) act(() => void vi.advanceTimersByTime(ms));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  stub?.restore();
  stub = undefined;
});

describe("createCanvasTexture", () => {
  it("configures a texture that can carry legible text", () => {
    const { canvas, texture } = createCanvasTexture(640, 400);

    expect([canvas.width, canvas.height]).toEqual([640, 400]);
    // sRGB keeps the screens the color the draw routines asked for; linear filtering with no
    // mipmap chain keeps 9px monospace readable and skips a re-generation on every upload.
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.minFilter).toBe(LinearFilter);
    expect(texture.magFilter).toBe(LinearFilter);
    expect(texture.generateMipmaps).toBe(false);

    texture.dispose();
  });
});

describe("useLeftScreenTexture", () => {
  it("paints the editor on mount rather than leaving a dark panel", () => {
    const contexts = record();
    renderHook(() => useLeftScreenTexture());

    expect(contexts).toHaveLength(1);
    expect(contexts[0]!.text.length).toBeGreaterThan(0);
  });

  /** A caret that does not blink is indistinguishable from a frozen screen. */
  it("blinks the caret on a 600 ms clock, repainting each time", () => {
    const contexts = record();
    renderHook(() => useLeftScreenTexture());

    act(() => void vi.advanceTimersByTime(CARET_MS - 1));
    expect(contexts).toHaveLength(1);

    ticks(2, CARET_MS);

    expect(contexts).toHaveLength(3);
    expect(contexts[1]!.transcript).not.toEqual(contexts[0]!.transcript);
    // On again after two flips: the caret is a two-state cycle, not a one-way change.
    expect(contexts[2]!.transcript).toEqual(contexts[0]!.transcript);
  });

  it("re-uploads one texture instead of building a new one per blink", () => {
    record();
    const { result } = renderHook(() => useLeftScreenTexture());
    const version = result.current.version;

    ticks(2, CARET_MS);

    expect(result.current.version).toBe(version + 2);
  });

  it("stops the blink and releases the canvas when the world unmounts", () => {
    const contexts = record();
    const { result, unmount } = renderHook(() => useLeftScreenTexture());
    const dispose = vi.spyOn(result.current, "dispose");

    unmount();
    ticks(3, CARET_MS);

    expect(contexts).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("survives a browser that refuses a 2D context", () => {
    const { result } = renderHook(() => useLeftScreenTexture());

    ticks(1, CARET_MS);

    expect(result.current.image).toBeInstanceOf(HTMLCanvasElement);
  });
});

describe("useCenterScreenTexture", () => {
  /**
   * Fixed, and in winter: Lisbon is UTC+0 in January, so the printed hour is the UTC one.
   * Also aligned to the three-second focus grid, which is measured from the epoch rather
   * than from mount — starting mid-window makes the first rotation land early.
   */
  const MOUNTED_AT = new Date("2026-01-15T09:41:06Z");

  beforeEach(() => {
    vi.setSystemTime(MOUNTED_AT);
  });

  function textOf(context: RecordingContext): string {
    return context.text.join(" | ");
  }

  it("shows the studio's local clock, to the second", () => {
    const contexts = record();
    renderHook(() => useCenterScreenTexture());

    expect(textOf(contexts[0]!)).toContain("09:41:06");
  });

  it("advances the clock every second", () => {
    const contexts = record();
    renderHook(() => useCenterScreenTexture());

    ticks(2, TERMINAL_TICK_MS);

    expect(contexts).toHaveLength(3);
    expect(textOf(contexts[1]!)).toContain("09:41:07");
    expect(textOf(contexts[2]!)).toContain("09:41:08");
  });

  /** Uptime is counted from mount, so it starts at zero however late in the day it is. */
  it("counts uptime from the moment the screen came up", () => {
    const contexts = record();
    renderHook(() => useCenterScreenTexture());

    ticks(65, TERMINAL_TICK_MS);

    expect(textOf(contexts[0]!)).toContain("00:00:00");
    expect(textOf(contexts.at(-1)!)).toContain("00:01:05");
  });

  it("rotates the focus line through the pool every three seconds", () => {
    const contexts = record();
    renderHook(() => useCenterScreenTexture());

    ticks(3, TERMINAL_TICK_MS);

    const shown = contexts.map((context) =>
      FOCUS_POOL.find((entry) => textOf(context).includes(entry)),
    );
    expect(shown.every((entry) => entry !== undefined)).toBe(true);
    // Same line for three seconds, then the next one — a rotation on every tick would read
    // as noise, and one that never moved would be a static label.
    expect(new Set(shown.slice(0, 3)).size).toBe(1);
    expect(shown[3]).not.toBe(shown[0]);
  });

  it("stops the clock and releases the canvas when the world unmounts", () => {
    const contexts = record();
    const { result, unmount } = renderHook(() => useCenterScreenTexture());
    const dispose = vi.spyOn(result.current as CanvasTexture, "dispose");

    unmount();
    ticks(3, TERMINAL_TICK_MS);

    expect(contexts).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("survives a browser that refuses a 2D context", () => {
    const { result } = renderHook(() => useCenterScreenTexture());

    ticks(1, TERMINAL_TICK_MS);

    expect(result.current.image).toBeInstanceOf(HTMLCanvasElement);
  });
});

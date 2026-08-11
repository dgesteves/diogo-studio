import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";

import { useLoungeTvTexture } from "./use-lounge-tv-texture";

/**
 * The hook that drives the lounge television. `lounge-tv.test.ts` owns what each frame
 * paints; this owns the clock behind it — one texture, repainted on a 110 ms interval and
 * re-uploaded to the GPU each time.
 *
 * The interval and the texture are both resources: the canvas unmounts whenever a visitor
 * turns motion off mid-session (`world-stage.tsx` gates the whole scene on it), and
 * anything this hook allocates and does not release survives that.
 */

const TICK_MS = 110;

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

function record(): readonly RecordingContext[] {
  stub = stubCanvasContexts();
  return stub.contexts;
}

/**
 * One interval at a time. Advancing past several in a single `act` is not the same thing:
 * React batches the state updates into one render and the hook paints once, which a
 * browser spacing them 110 ms apart never does.
 */
function ticks(count: number): void {
  for (let i = 0; i < count; i += 1) act(() => void vi.advanceTimersByTime(TICK_MS));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  stub?.restore();
  stub = undefined;
});

describe("useLoungeTvTexture", () => {
  it("paints the first frame on mount, before any tick has elapsed", () => {
    const contexts = record();
    renderHook(() => useLoungeTvTexture());

    // A television that is blank until the first interval lands is a black screen for an
    // eighth of a second on every entry into the world.
    expect(contexts).toHaveLength(1);
    expect(contexts[0]!.text.length).toBeGreaterThan(0);
  });

  it("repaints a new frame on every tick", () => {
    const contexts = record();
    renderHook(() => useLoungeTvTexture());

    ticks(3);

    expect(contexts).toHaveLength(4);
    // Each frame is a pure function of the tick, so consecutive frames have to differ —
    // an interval that never advanced the tick would still repaint, identically.
    expect(contexts[1]!.transcript).not.toEqual(contexts[0]!.transcript);
    expect(contexts[3]!.transcript).not.toEqual(contexts[2]!.transcript);
  });

  it("holds one canvas and re-uploads it rather than building a texture per frame", () => {
    record();
    const { result } = renderHook(() => useLoungeTvTexture());
    const texture = result.current;
    const version = texture.version;

    ticks(2);

    expect(result.current).toBe(texture);
    // `needsUpdate = true` bumps the version; without it three keeps showing frame one.
    expect(result.current.version).toBe(version + 2);
  });

  it("stops the clock when the world unmounts", () => {
    const contexts = record();
    const { unmount } = renderHook(() => useLoungeTvTexture());
    unmount();

    ticks(5);

    expect(contexts).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("releases the texture when the world unmounts", () => {
    record();
    const { result, unmount } = renderHook(() => useLoungeTvTexture());
    const dispose = vi.spyOn(result.current, "dispose");

    unmount();

    // Turning motion on and off repeatedly unmounts and remounts the canvas; a texture
    // left undisposed stays on the GPU for the rest of the session, once per cycle.
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("returns a texture when the browser refuses a 2D context", () => {
    const { result } = renderHook(() => useLoungeTvTexture());

    ticks(1);

    expect(result.current.image).toBeInstanceOf(HTMLCanvasElement);
  });
});

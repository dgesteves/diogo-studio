/* eslint-disable no-console -- the subject of this file is `console.warn` itself: every call
   below is either the wrapper being exercised or the sink it was installed over. */

import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The one console filter in the codebase, installed by `vitest.setup.ts` and by
 * `world-canvas.tsx`. It drops a single upstream deprecation that `@react-three/fiber` emits
 * on every render, and the whole suite's "zero stderr output" rule leans on it — so the
 * property that actually needs asserting is the one nobody would notice breaking: that it
 * still lets every *other* warning through. A wrapper that swallowed all of them would make
 * the suite quieter and blinder at the same time.
 *
 * It runs in node because it touches nothing but `console`, and it installs itself over a
 * spy rather than being tested through the copy the jsdom setup already installed: that copy
 * closed over the real `console.warn` when it loaded, so there is no way to observe it.
 */

const FLAG = "__r3fClockDeprecationSilenced";
const DEPRECATION = "THREE.Clock: This module has been deprecated. Use THREE.Timer instead.";

type Globals = typeof globalThis & { [FLAG]?: boolean };

const realWarn = console.warn;

afterEach(() => {
  console.warn = realWarn;
  delete (globalThis as Globals)[FLAG];
});

/** Loads a fresh copy of the module over a sink it can be observed through. */
async function install(): Promise<ReturnType<typeof vi.fn>> {
  const sink = vi.fn();
  console.warn = sink;
  delete (globalThis as Globals)[FLAG];
  vi.resetModules();
  await import("./silence-clock-deprecation");
  return sink;
}

describe("silence-clock-deprecation", () => {
  it("drops the upstream clock deprecation", async () => {
    const sink = await install();

    console.warn(DEPRECATION);

    expect(sink).not.toHaveBeenCalled();
  });

  it("passes every other warning through untouched", async () => {
    const sink = await install();

    const carrier = new Error(DEPRECATION);

    console.warn("Each child in a list should have a unique key.", { count: 3 });
    console.warn(carrier);

    expect(sink).toHaveBeenNthCalledWith(1, "Each child in a list should have a unique key.", {
      count: 3,
    });
    /**
     * Only fiber's literal string is dropped. An `Error` is not stringified before the match,
     * so a real failure that happens to quote the deprecation still reaches the console —
     * which is the difference between filtering one line of noise and losing a report.
     */
    expect(sink).toHaveBeenNthCalledWith(2, carrier);
  });

  /** Re-importing must not wrap the wrapper: each layer would cost every warning a frame. */
  it("installs itself only once", async () => {
    await install();
    const wrapper = console.warn;

    vi.resetModules();
    await import("./silence-clock-deprecation");

    expect(console.warn).toBe(wrapper);
  });
});

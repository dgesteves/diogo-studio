import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { act } from "@testing-library/react";
import { renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import { getPerfSnapshot } from "@/world/perf";
import { PerfReporter } from "./perf-reporter";
import { ScenePrecompile } from "./scene-precompile";

/**
 * The two components the world wraps its scene in that draw nothing: one tells the boot
 * screen when the shaders are warm, the other feeds the inspector its frame stats. Both read
 * `state.gl`, so each test stubs the piece of the mock renderer it depends on through
 * `prepare` — the renderer exists before the children that use it, which is what makes a
 * mount-time effect assertable.
 *
 * A third, `WebGLContextGuard`, was deleted while this file was being written: three's own
 * `WebGLRenderer` registers a `webglcontextlost` listener in its constructor and that handler
 * already calls `preventDefault()`, so the component could not change anything observable and
 * a test of it passed with its body removed. See `docs/decisions.md`.
 */

afterEach(unmountScenes);

describe("ScenePrecompile", () => {
  let onCompiled: Mock<() => void>;

  beforeEach(() => {
    onCompiled = vi.fn<() => void>();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Resolve, reject, or neither: the boot screen has to come down in all three. */
  async function precompile(compileAsync: () => Promise<void>): Promise<SceneQuery> {
    return renderScene(<ScenePrecompile onCompiled={onCompiled} />, {
      prepare: (state) => {
        // three resolves `compileAsync` with the scene it compiled; only the settling matters
        // here, so the stub awaits the test's promise and then answers in that shape.
        vi.spyOn(state.gl, "compileAsync").mockImplementation(async (target) => {
          await compileAsync();
          return target;
        });
      },
    });
  }

  it("reports the scene ready once the shaders have compiled", async () => {
    await precompile(() => Promise.resolve());
    await act(async () => {});

    expect(onCompiled).toHaveBeenCalledTimes(1);
  });

  /**
   * `compileAsync` rejects on a driver that refuses the parallel-compile extension. Treating
   * that as fatal would leave a working scene hidden behind the boot screen forever, so both
   * settlements take the same path.
   */
  it("reports it ready even when compilation fails", async () => {
    await precompile(() => Promise.reject(new Error("no parallel shader compile")));
    await act(async () => {});

    expect(onCompiled).toHaveBeenCalledTimes(1);
  });

  it("gives up waiting after eight seconds on a driver that never answers", async () => {
    await precompile(() => new Promise<void>(() => {}));
    expect(onCompiled).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(7999);
    });
    expect(onCompiled).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(onCompiled).toHaveBeenCalledTimes(1);
  });

  it("reports ready once when the timeout and the compile both land", async () => {
    let settle = (): void => {};
    await precompile(() => new Promise<void>((resolve) => (settle = resolve)));

    await act(async () => {
      vi.advanceTimersByTime(8000);
      settle();
    });

    expect(onCompiled).toHaveBeenCalledTimes(1);
  });

  /** Reporting a scene ready after its canvas is gone marks the boot store from nowhere. */
  it("says nothing once the canvas has been unmounted", async () => {
    let settle = (): void => {};
    const scene = await precompile(() => new Promise<void>((resolve) => (settle = resolve)));

    await scene.unmount();
    await act(async () => {
      settle();
      vi.advanceTimersByTime(8000);
    });

    expect(onCompiled).not.toHaveBeenCalled();
  });
});

describe("PerfReporter", () => {
  /**
   * The sampling window is measured with `performance.now()`, which vitest's fake timers do
   * not move, so the clock is stubbed directly. It is also the honest seam: what matters is
   * how much wall time a number of frames took, and here the test states both.
   */
  // Not zero: the reporter uses `windowStart === 0` as "no window open yet", so a clock that
  // starts at the origin opens a second window on the frame that should have closed the first.
  const CLOCK_ORIGIN = 1_000;
  let elapsed = CLOCK_ORIGIN;

  function passTime(ms: number): void {
    elapsed += ms;
  }

  beforeEach(() => {
    elapsed = CLOCK_ORIGIN;
    vi.spyOn(performance, "now").mockImplementation(() => elapsed);
  });

  /** The renderer's own counters, set to values nothing else in the run could produce. */
  const RENDER_INFO = {
    calls: 137,
    triangles: 90_210,
    geometries: 44,
    textures: 17,
    programs: 9,
  };

  async function reporter(programs: unknown = new Array(RENDER_INFO.programs)) {
    return renderScene(<PerfReporter />, {
      prepare: (state) => {
        const info = state.gl.info as unknown as Record<string, unknown>;
        // `autoReset` would zero the counters on the mock renderer's own render pass.
        info.autoReset = false;
        info.render = { frame: 0, calls: RENDER_INFO.calls, triangles: RENDER_INFO.triangles };
        info.memory = { geometries: RENDER_INFO.geometries, textures: RENDER_INFO.textures };
        info.programs = programs;
      },
    });
  }

  /**
   * A quarter second, not a frame: sampling every frame would publish 60 store updates a
   * second into the inspector overlay, and the overlay re-renders on each one.
   */
  it("publishes nothing until a quarter second of frames has passed", async () => {
    const scene = await reporter();

    await scene.advance(1);
    passTime(249);
    await scene.advance(1);

    expect(getPerfSnapshot().active).toBe(false);
  });

  it("publishes the frame rate and the renderer's own counters once the window closes", async () => {
    const scene = await reporter();

    await scene.advance(1);
    passTime(250);
    await scene.advance(1);

    expect(getPerfSnapshot()).toMatchObject({
      active: true,
      // Two frames across 250 ms, so 8 fps at 125 ms each — the arithmetic, not a guess.
      fps: 8,
      frameMs: 125,
      drawCalls: RENDER_INFO.calls,
      triangles: RENDER_INFO.triangles,
      geometries: RENDER_INFO.geometries,
      textures: RENDER_INFO.textures,
      programs: RENDER_INFO.programs,
    });
  });

  it("reports no programs rather than crashing on a renderer that lists none", async () => {
    const scene = await reporter(null);

    await scene.advance(1);
    passTime(250);
    await scene.advance(1);

    // Asserted alongside a published reading: zero is also the store's initial value, so on
    // its own this assertion would pass against a reporter that never ran.
    expect(getPerfSnapshot()).toMatchObject({ active: true, programs: 0, fps: 8 });
  });

  /** A window that kept its frame count would report a rate that only ever climbed. */
  it("starts a fresh count for each window", async () => {
    const scene = await reporter();

    await scene.advance(1);
    passTime(250);
    await scene.advance(1);
    expect(getPerfSnapshot().fps).toBe(8);

    for (let frame = 0; frame < 5; frame += 1) await scene.advance(1);
    passTime(500);
    await scene.advance(1);

    expect(getPerfSnapshot().fps).toBe(12);
  });

  /** The overlay shows a live reading; leaving it on screen after the canvas dies is a lie. */
  it("marks the readings stale when the canvas goes away", async () => {
    const scene = await reporter();

    await scene.advance(1);
    passTime(250);
    await scene.advance(1);
    expect(getPerfSnapshot().active).toBe(true);

    await scene.unmount();

    expect(getPerfSnapshot().active).toBe(false);
  });
});

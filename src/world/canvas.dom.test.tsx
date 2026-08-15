import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { type ReactNode } from "react";
import { Color, type Fog, type PerspectiveCamera } from "three";
import type * as Fiber from "@react-three/fiber";
import type * as Drei from "@react-three/drei";
import { renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import { CommandMenuProvider } from "@/command-menu/store";
import { worldPalettes } from "./materials";

import { getBootSnapshot, setExplore, setWorldMode, type WorldMode } from "./store";
import { DPR_DEGRADED, DPR_MAX, DPR_MIN, type WorldQuality } from "./quality";
import { EXPLORE } from "./explore";
import { getStation } from "./stations";
import { WorldCanvas, PerfReporter, ScenePrecompile } from "./canvas";
import { getPerfSnapshot } from "./perf";

/**
 * The composition root of the 3D world: it decides what the renderer is allowed to cost and
 * which of the scene's layers exist at all. Every child has its own spec, so what this file
 * owns is the decisions — the quality tier reaching the renderer, the palette reaching the
 * fog, explore mode swapping the interaction layer, and the boot screen coming down.
 *
 * `Canvas` is replaced with a pass-through that records the props it was handed, so the whole
 * tree mounts inside RTTR's own root instead of a second one. That is the only substitution:
 * the scene, the camera, the quality guard and the effect chain are all real, which is why
 * `@react-three/postprocessing` had to be added to `server.deps.inline` in `vitest.config.ts`
 * before any of this would resolve one copy of fiber.
 */

type CanvasProps = {
  frameloop?: string;
  dpr?: number;
  gl?: { antialias?: boolean; alpha?: boolean; powerPreference?: string };
};

type Monitor = {
  onChange: (state: { factor: number }) => void;
  onFallback: () => void;
};

const canvas = vi.hoisted(() => ({ renders: [] as Record<string, unknown>[] }));
const effects = vi.hoisted(() => ({ rendered: [] as Record<string, unknown>[] }));
const nav = vi.hoisted(() => ({ push: vi.fn() }));
const monitor = vi.hoisted(() => ({
  props: undefined as
    { onChange: (state: { factor: number }) => void; onFallback: () => void } | undefined,
}));

vi.mock("@react-three/fiber", async (importOriginal) => {
  const actual = await importOriginal<typeof Fiber>();
  return {
    ...actual,
    Canvas: ({ children, ...props }: { children?: ReactNode }) => {
      canvas.renders.push(props);
      return <>{children}</>;
    },
  };
});

/**
 * The effect chain is the one thing that cannot run headlessly: `EffectComposer` reads
 * `getContextAttributes().alpha` off a real WebGL context, which the mock renderer has no
 * answer for. Stubbing the library rather than our own component keeps `WorldPostprocessing`
 * itself executing, so the palette values it passes are still asserted here.
 */
vi.mock("@react-three/postprocessing", () => ({
  EffectComposer: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Bloom: (props: Record<string, unknown>) => {
    effects.rendered.push({ effect: "bloom", ...props });
    return null;
  },
  Vignette: (props: Record<string, unknown>) => {
    effects.rendered.push({ effect: "vignette", ...props });
    return null;
  },
}));

/**
 * Only the monitor, and only because the factor it reports has to become a device pixel
 * ratio: every other drei component in the tree — the rounded boxes, the neon's `<Html>`, the
 * instanced shelf — stays real.
 */
vi.mock("@react-three/drei", async (importOriginal) => {
  const actual = await importOriginal<typeof Drei>();
  return {
    ...actual,
    PerformanceMonitor: (props: Record<string, unknown>) => {
      monitor.props = props as unknown as Monitor;
      return null;
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => "/",
}));

beforeEach(() => {
  monitor.props = undefined;
  canvas.renders.length = 0;
  effects.rendered.length = 0;
  nav.push.mockClear();
});

afterEach(unmountScenes);

type Options = { quality?: WorldQuality; mode?: WorldMode; explore?: boolean };

async function world({
  quality = "full",
  mode = "night",
  explore = false,
}: Options = {}): Promise<SceneQuery> {
  await act(async () => {
    setWorldMode(mode);
    setExplore(explore);
  });

  return renderScene(
    <CommandMenuProvider>
      <WorldCanvas active="home" quality={quality} onQuality={vi.fn()} />
    </CommandMenuProvider>,
    {
      prepare: (state) => {
        // The scene precompiles on mount, and three's real `compileAsync` polls a driver that
        // does not exist here — it leaves a timer running past the end of the test.
        vi.spyOn(state.gl, "compileAsync").mockImplementation(async (target) => target);
        // The room's three `<ContactShadows>` render to an offscreen target on every frame,
        // and a mock context has no framebuffer to bind. This is the one piece of the scene
        // that genuinely needs a GPU; everything around it runs.
        vi.spyOn(state.gl, "setRenderTarget").mockImplementation(() => {});
      },
    },
  );
}

function canvasProps(): CanvasProps {
  return canvas.renders.at(-1) as CanvasProps;
}

describe("WorldCanvas", () => {
  it("mounts the whole world in one canvas", async () => {
    const scene = await world();

    // The five layers the canvas composes, each asserted in its own spec: the studio, the
    // props, the lounge, the neon and the AI core. A layer dropped from the tree here would
    // leave every one of those specs green.
    expect(scene.meshes.length).toBeGreaterThan(300);
    expect(scene.lights.length).toBeGreaterThan(20);
  });

  it("aims the default camera at the home station", async () => {
    const scene = await world();

    const camera = scene.state.camera as PerspectiveCamera;
    expect(camera.fov).toBe(44);
    expect(camera.position.toArray()).toEqual([...getStation("home").position]);
  });

  it("paints the room's own sky and fog, and swaps them with the palette", async () => {
    const night = await world({ mode: "night" });
    const nightFog = night.state.scene.fog as Fog;

    expect((night.state.scene.background as Color).getHexString()).toBe(
      new Color(worldPalettes.night.background).getHexString(),
    );
    expect(nightFog.near).toBe(worldPalettes.night.fogNear);
    expect(nightFog.far).toBe(worldPalettes.night.fogFar);

    await unmountScenes();
    const day = await world({ mode: "day" });

    expect((day.state.scene.background as Color).getHexString()).toBe(
      new Color(worldPalettes.day.background).getHexString(),
    );
  });

  /**
   * The tier contract from `three-r3f-world.md`. `frozen` means the device has already proven
   * it cannot hold a frame rate, so the loop stops and the world becomes the still image the
   * reduced-motion fallback already shows — rather than a page that drops clicks.
   */
  it("keeps the render loop running until the device has proven it cannot", async () => {
    for (const quality of ["full", "reduced"] as const) {
      await unmountScenes();
      await world({ quality });
      expect(canvasProps().frameloop).toBe("always");
    }

    await unmountScenes();
    await world({ quality: "frozen" });

    expect(canvasProps().frameloop).toBe("demand");
  });

  it("spends pixels and antialiasing only at full quality", async () => {
    await world({ quality: "full" });
    expect(canvasProps().dpr).toBe(DPR_MIN);
    expect(canvasProps().gl?.antialias).toBe(true);

    for (const quality of ["reduced", "frozen"] as const) {
      await unmountScenes();
      await world({ quality });

      expect(canvasProps().dpr).toBe(DPR_DEGRADED);
      expect(canvasProps().gl?.antialias).toBe(false);
    }
  });

  it("asks for an opaque, high-performance context", async () => {
    await world();

    // `alpha: false` is what lets the scene's own background be the page's; a transparent
    // drawing buffer also costs a composite the world does not need.
    expect(canvasProps().gl).toMatchObject({ alpha: false, powerPreference: "high-performance" });
  });

  it("drops the effect chain below full quality", async () => {
    await world({ quality: "full" });
    expect(effects.rendered.map((effect) => effect.effect)).toEqual(["bloom", "vignette"]);

    await unmountScenes();
    effects.rendered.length = 0;
    await world({ quality: "reduced" });

    expect(effects.rendered).toHaveLength(0);
  });

  it("tunes the bloom and vignette from the world palette", async () => {
    await world({ mode: "day" });

    expect(effects.rendered[0]).toMatchObject({
      effect: "bloom",
      intensity: worldPalettes.day.bloomIntensity,
      luminanceThreshold: worldPalettes.day.bloomLuminanceThreshold,
    });
    expect(effects.rendered[1]).toMatchObject({
      effect: "vignette",
      offset: worldPalettes.day.vignetteOffset,
      darkness: worldPalettes.day.vignetteDarkness,
    });
  });

  /**
   * `PerformanceMonitor` earns the resolution back rather than booting at the ceiling, so the
   * most expensive frames of the session are also the cheapest to draw. The factor it reports
   * has to become a device pixel ratio; a monitor wired to nothing leaves the world soft.
   */
  it("raises the resolution as the monitor reports headroom, and drops it on a fallback", async () => {
    await world({ quality: "full" });
    const reports = performanceMonitor();

    await act(async () => reports.onChange({ factor: 1 }));
    expect(canvasProps().dpr).toBe(DPR_MAX);

    await act(async () => reports.onChange({ factor: 0 }));
    expect(canvasProps().dpr).toBe(DPR_MIN);

    // Quantized to tenths: the drawing buffer is reallocated on every change, so a monitor
    // reporting a drifting factor must not resize it by a hundredth at a time.
    await act(async () => reports.onChange({ factor: 0.5 }));
    expect(canvasProps().dpr).toBe(1.3);

    await act(async () => reports.onFallback());
    expect(canvasProps().dpr).toBe(DPR_MIN);
  });

  it("watches the frame rate only where there is quality left to give up", async () => {
    await world({ quality: "full" });
    expect(monitor.props).toBeDefined();

    await unmountScenes();
    monitor.props = undefined;
    await world({ quality: "frozen" });

    expect(monitor.props).toBeUndefined();
  });

  /**
   * Explore mode is a different camera, not a different scene: `WorldCamera` yields the moment
   * the store says so and `ExploreController` takes over, standing the visitor up at eye height
   * and switching to yaw-then-pitch rotation. Rendering both controllers, or neither, is the
   * failure this catches — and it is the whole of explore mode.
   */
  it("stands the visitor up in explore mode and orbits otherwise", async () => {
    const orbiting = await world({ explore: false });
    await orbiting.advance(60, 1 / 60);
    expect(orbiting.state.camera.rotation.order).toBe("XYZ");
    // Orbiting looks down at the room from well above standing height.
    expect(orbiting.state.camera.position.y).toBeGreaterThan(EXPLORE.eyeHeight * 2);

    await unmountScenes();
    const exploring = await world({ explore: true });
    await exploring.advance(60, 1 / 60);

    expect(exploring.state.camera.rotation.order).toBe("YXZ");
    expect(exploring.state.camera.position.y).toBeCloseTo(EXPLORE.eyeHeight, 1);
  });

  /** The boot screen is waiting on this: the shaders are warm, so the world can be shown. */
  it("reports the world ready once the scene has compiled", async () => {
    const onReady = vi.fn();

    await act(async () => {
      setWorldMode("night");
      setExplore(false);
    });
    await renderScene(
      <CommandMenuProvider>
        <WorldCanvas active="home" quality="full" onQuality={vi.fn()} onReady={onReady} />
      </CommandMenuProvider>,
      {
        prepare: (state) =>
          void vi.spyOn(state.gl, "compileAsync").mockImplementation(async (target) => target),
      },
    );

    await act(async () => {});

    expect(getBootSnapshot().ready).toBe(true);
    expect(onReady).toHaveBeenCalledTimes(1);
  });
});

/**
 * A component that renders `null` leaves nothing in the scene graph and nothing in RTTR's
 * `toTree()`, which reports three instances rather than React elements — so the monitor is
 * reached through the props the stub recorded.
 */
function performanceMonitor(): Monitor {
  if (!monitor.props) throw new Error("The canvas rendered no PerformanceMonitor");
  return monitor.props;
}

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

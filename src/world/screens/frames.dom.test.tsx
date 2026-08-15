import { afterEach, describe, expect, it, vi } from "vitest";
import type { CanvasTexture } from "three";

import { renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";

import { useRightScreenTexture } from "./monitors";
import { useTabletScreenTexture } from "./tablet";

/**
 * The two desk screens driven by the frame loop rather than by a timer: the metrics panel
 * that reports the renderer's own frame rate, and the tablet that draws a stroke. Both need a
 * live root, so they mount inside a scene and the test advances frames by hand — `create()`
 * sets `frameloop: "never"`, which is what makes a frame-rate readout deterministic.
 */

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

afterEach(async () => {
  await unmountScenes();
  stub?.restore();
  stub = undefined;
});

type Mounted = {
  scene: SceneQuery;
  contexts: readonly RecordingContext[];
  texture: () => CanvasTexture;
};

/** Mounts one texture hook inside a scene and hands back what it painted. */
async function mount(hook: () => CanvasTexture): Promise<Mounted> {
  stub = stubCanvasContexts();
  let latest: CanvasTexture | undefined;

  function Screen(): null {
    latest = hook();
    return null;
  }

  const scene = await renderScene(<Screen />);

  return {
    scene,
    contexts: stub.contexts,
    texture: () => {
      if (!latest) throw new Error("The hook returned no texture");
      return latest;
    },
  };
}

describe("useRightScreenTexture", () => {
  /** Tenths, so the accumulated delta reaches the sampling window without a float remainder. */
  const FRAME = 0.1;

  /**
   * Half a second, not a frame. Redrawing 640×400 of text every frame would cost more than
   * the scene it is measuring, and the reading would be too noisy to read anyway.
   */
  it("samples the frame rate twice a second rather than every frame", async () => {
    const { scene, contexts } = await mount(useRightScreenTexture);

    await scene.advance(4, FRAME);
    expect(contexts).toHaveLength(0);

    await scene.advance(1, FRAME);
    expect(contexts).toHaveLength(1);
  });

  it("reports the frame rate it measured, with the renderer's resolution", async () => {
    const { scene, contexts } = await mount(useRightScreenTexture);

    // Five frames across half a second: 10 fps at 100 ms each, which is what the panel shows.
    await scene.advance(5, FRAME);

    const text = contexts[0]!.text.join(" | ");
    expect(text).toContain("10");
    expect(text).toContain("100.0 ms");
    expect(text).toContain(
      `${scene.state.gl.domElement.width}×${scene.state.gl.domElement.height}`,
    );
    expect(text).toContain(`${scene.state.gl.getPixelRatio().toFixed(2)}×`);
  });

  /** A sparkline is a history: keeping only the latest sample would draw a flat line. */
  it("keeps a fixed window of samples, dropping the oldest", async () => {
    const { scene, contexts } = await mount(useRightScreenTexture);

    await scene.advance(5, FRAME);
    await scene.advance(5, FRAME * 2);

    const [first, second] = contexts.map((context) => context.paths.at(-1)!.points.length);
    expect(first).toBe(second);
    expect(contexts[0]!.transcript).not.toEqual(contexts[1]!.transcript);
  });

  it("releases the canvas when the world unmounts", async () => {
    const mounted = await mount(useRightScreenTexture);
    const dispose = vi.spyOn(mounted.texture(), "dispose");

    await mounted.scene.unmount();

    expect(dispose).toHaveBeenCalledOnce();
  });
});

describe("useTabletScreenTexture", () => {
  const REDRAW_SECONDS = 1 / 15;

  it("redraws fifteen times a second at most", async () => {
    const { scene, contexts } = await mount(useTabletScreenTexture);

    // The first frame draws: the interval starts already elapsed so the tablet is never blank.
    await scene.advance(1, REDRAW_SECONDS);
    expect(contexts).toHaveLength(1);

    await scene.advance(3, REDRAW_SECONDS / 4);
    expect(contexts).toHaveLength(1);

    await scene.advance(1, REDRAW_SECONDS / 4);
    expect(contexts).toHaveLength(2);
  });

  /** The stroke is drawn progressively; a progress that never grew would be a static line. */
  it("extends the stroke as the drawing progresses", async () => {
    const { scene, contexts } = await mount(useTabletScreenTexture);

    await scene.advance(1, REDRAW_SECONDS);
    await scene.advance(1, 2);
    await scene.advance(1, 2);

    const points = contexts.map((context) =>
      Math.max(...context.paths.map((path) => path.points.length)),
    );
    expect(points[1]!).toBeGreaterThan(points[0]!);
    expect(points[2]!).toBeGreaterThan(points[1]!);
  });

  /** Five seconds of stroke, then it holds complete for 1.8 s before starting over. */
  it("holds the finished stroke, then starts a new one", async () => {
    const { scene, contexts } = await mount(useTabletScreenTexture);

    await scene.advance(1, 5);
    const complete = Math.max(...contexts[0]!.paths.map((path) => path.points.length));

    await scene.advance(1, 1.5);
    expect(Math.max(...contexts[1]!.paths.map((path) => path.points.length))).toBe(complete);

    await scene.advance(1, 1);
    expect(Math.max(...contexts[2]!.paths.map((path) => path.points.length))).toBeLessThan(
      complete,
    );
  });

  /** Pressure varies the nib width; a fixed one draws with a ballpoint. */
  it("varies the line width with the pen pressure", async () => {
    const { scene, contexts } = await mount(useTabletScreenTexture);

    await scene.advance(1, REDRAW_SECONDS);
    await scene.advance(1, 0.6);

    const widths = contexts.map((context) => context.valuesOf("lineWidth"));
    expect(widths[0]).not.toEqual(widths[1]);
  });

  it("releases the canvas when the world unmounts", async () => {
    const mounted = await mount(useTabletScreenTexture);
    const dispose = vi.spyOn(mounted.texture(), "dispose");

    await mounted.scene.unmount();

    expect(dispose).toHaveBeenCalledOnce();
  });
});

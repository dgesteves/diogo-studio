import { afterEach, describe, expect, it, vi } from "vitest";
import type { CanvasTexture } from "three";

import { renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";

import { useRightScreenTexture } from "./monitors";

/**
 * The one desk screen driven by the frame loop rather than by a timer: the metrics panel that
 * reports the renderer's own frame rate. It needs a live root, so it mounts inside a scene and
 * the test advances frames by hand — `create()` sets `frameloop: "never"`, which is what makes
 * a frame-rate readout deterministic. The two home screens are in `home.dom.test.tsx`.
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

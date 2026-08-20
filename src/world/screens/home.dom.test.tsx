import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasTexture } from "three";

import { renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import { stubCanvasContexts, type RecordingContext } from "@tests/recording-ctx";

import { type HomeApp } from "./home";
import { usePhoneScreenTexture } from "./phone";
import { useTabletScreenTexture } from "./tablet";

/**
 * The two devices lying on the desk. Neither is driven by the frame loop — a home screen has
 * nothing on it that moves except the minute — so what these assert is the cost side of that:
 * the screen is painted once on mount, a tick inside the minute already drawn repaints
 * nothing, and the canvas is released with the world.
 *
 * The clock is the room's, so both devices are mounted against one fake system time and must
 * agree on it: two clocks in one room disagreeing is a defect rather than a detail.
 */

const APPS: readonly HomeApp[] = ["Studio", "About", "Work", "Projects", "Case studies"].map(
  (label) => ({ label, accent: "#22d3ee" }),
);

/**
 * Ten seconds into the minute, so half a tick lands inside it. Written as an instant rather
 * than a wall time: the studio keeps its own zone, and these read the clock it is set to.
 */
const START = new Date("2026-08-20T14:35:10Z");
const STUDIO_MINUTE = "15:35";
const STUDIO_NEXT_MINUTE = "15:36";
const HALF_MINUTE = 30_000;

/** The tick writes state, so the timers are advanced inside `act` or React holds the render. */
const tick = async (ms: number): Promise<void> => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

let stub: { contexts: readonly RecordingContext[]; restore: () => void } | undefined;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(START);
});

afterEach(async () => {
  await unmountScenes();
  stub?.restore();
  stub = undefined;
  vi.useRealTimers();
});

type Mounted = {
  scene: SceneQuery;
  contexts: readonly RecordingContext[];
  texture: () => CanvasTexture;
};

/** Mounts one texture hook inside a scene and hands back what it painted. */
async function mount(hook: (apps: readonly HomeApp[]) => CanvasTexture): Promise<Mounted> {
  stub = stubCanvasContexts();
  let latest: CanvasTexture | undefined;

  function Screen(): null {
    latest = hook(APPS);
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

const DEVICES = [
  ["the phone", usePhoneScreenTexture],
  ["the tablet", useTabletScreenTexture],
] as const;

describe.each(DEVICES)("%s's home screen", (_name, hook) => {
  it("is painted once, on mount", async () => {
    const { contexts } = await mount(hook);

    expect(contexts).toHaveLength(1);
    expect(contexts[0]!.text).toContain(STUDIO_MINUTE);
  });

  /**
   * The minute is the state, so a tick landing inside the one already drawn stops at React
   * rather than at a canvas. This is over a megabyte of texture: re-uploading it every half
   * minute to redraw four glyphs that did not move would be the whole cost of the object.
   */
  it("repaints on the minute rather than on the tick", async () => {
    const { contexts } = await mount(hook);

    await tick(HALF_MINUTE);
    expect(contexts).toHaveLength(1);

    await tick(HALF_MINUTE);
    expect(contexts).toHaveLength(2);
    expect(contexts[1]!.text).toContain(STUDIO_NEXT_MINUTE);
  });

  it("releases the canvas when the world unmounts", async () => {
    const mounted = await mount(hook);
    const dispose = vi.spyOn(mounted.texture(), "dispose");

    await mounted.scene.unmount();

    expect(dispose).toHaveBeenCalledOnce();
  });
});

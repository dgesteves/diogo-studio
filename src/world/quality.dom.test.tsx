import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderScene, unmountScenes, type SceneQuery } from "@tests/r3f";
import {
  FRAME_BROKEN_MS,
  FRAME_GRACE_COUNT,
  FRAME_STRAINED_MS,
  FRAME_STRAINED_STREAK,
  type WorldQuality,
} from "./quality";
import { WorldQualityGuard } from "./quality";

/**
 * The watchdog that stops the world costing a visitor the page. `frame-budget.test.ts`
 * owns the thresholds; this file owns the wiring — that the guard measures wall-clock time
 * between frames rather than the delta it is handed, that it steps one tier per verdict,
 * and that a backgrounded tab is not mistaken for a dying renderer.
 */

let now = 0;

/** Runs one frame that took `ms` of wall clock, whatever `delta` the loop reports. */
async function frame(scene: SceneQuery, ms: number): Promise<void> {
  now += ms;
  await scene.advance(1, 1 / 60);
}

async function frames(scene: SceneQuery, count: number, ms: number): Promise<void> {
  for (let i = 0; i < count; i += 1) await frame(scene, ms);
}

/** The grace window plus the first timed frame, all of them healthy. */
async function warmUp(scene: SceneQuery): Promise<void> {
  await frames(scene, FRAME_GRACE_COUNT + 1, 16);
}

beforeEach(() => {
  now = 1_000;
  vi.spyOn(performance, "now").mockImplementation(() => now);
});

afterEach(async () => {
  await unmountScenes();
  vi.restoreAllMocks();
});

async function guard(quality: WorldQuality = "full") {
  const onDegrade = vi.fn();
  const scene = await renderScene(<WorldQualityGuard quality={quality} onDegrade={onDegrade} />);
  return { scene, onDegrade };
}

describe("WorldQualityGuard", () => {
  it("leaves a device that keeps up alone", async () => {
    const { scene, onDegrade } = await guard();

    await warmUp(scene);
    await frames(scene, 120, 16);

    expect(onDegrade).not.toHaveBeenCalled();
  });

  it("ignores the first frames, which spike while the scene is still being built", async () => {
    const { scene, onDegrade } = await guard();

    // Long enough to freeze the world, if anything were judging them yet.
    await frames(scene, FRAME_GRACE_COUNT, FRAME_BROKEN_MS * 2);

    expect(onDegrade).not.toHaveBeenCalled();
  });

  it("steps down one tier after a sustained run of strained frames", async () => {
    const { scene, onDegrade } = await guard("full");

    await warmUp(scene);
    await frames(scene, FRAME_STRAINED_STREAK, FRAME_STRAINED_MS + 50);

    expect(onDegrade).toHaveBeenCalledWith("reduced");
  });

  it("does not step on a single slow frame, which is what a garbage collection looks like", async () => {
    const { scene, onDegrade } = await guard();

    await warmUp(scene);
    await frames(scene, FRAME_STRAINED_STREAK - 1, FRAME_STRAINED_MS + 50);
    await frame(scene, 16);
    await frames(scene, FRAME_STRAINED_STREAK - 1, FRAME_STRAINED_MS + 50);

    expect(onDegrade).not.toHaveBeenCalled();
  });

  it("freezes outright on one frame long enough to swallow a click", async () => {
    const { scene, onDegrade } = await guard("full");

    await warmUp(scene);
    await frame(scene, FRAME_BROKEN_MS);

    // Straight past `reduced`: no reduction in pixels rescues a two-second frame.
    expect(onDegrade).toHaveBeenCalledWith("frozen");
  });

  it("has nothing left to ask for once the world is already frozen", async () => {
    const { scene, onDegrade } = await guard("frozen");

    await warmUp(scene);
    await frames(scene, FRAME_STRAINED_STREAK, FRAME_STRAINED_MS + 50);

    expect(onDegrade).not.toHaveBeenCalled();
  });

  /**
   * `requestAnimationFrame` is paused while a tab is hidden, so the first frame back
   * carries the whole time away with it. Judging that would degrade the world of anyone
   * who switched tabs for two seconds.
   */
  it("does not punish a visitor for coming back to the tab", async () => {
    const { scene, onDegrade } = await guard();
    await warmUp(scene);

    document.dispatchEvent(new Event("visibilitychange"));
    await frame(scene, 60_000);

    expect(onDegrade).not.toHaveBeenCalled();

    // And it is measuring again straight afterwards.
    await frame(scene, 16);
    await frame(scene, FRAME_BROKEN_MS);
    expect(onDegrade).toHaveBeenCalledWith("frozen");
  });

  it("stops watching the tab once the canvas is gone", async () => {
    const { scene } = await guard();
    const remove = vi.spyOn(document, "removeEventListener");

    await scene.unmount();

    expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });
});

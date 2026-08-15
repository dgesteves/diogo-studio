"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * What the renderer is allowed to cost. The tier walks `full → reduced → frozen`, one way
 * only, and is published on the world root as `data-world-quality`. The DPR ladder lives here
 * too: it is the same decision measured before the canvas mounts rather than after.
 */

/**
 * Start at the cheapest resolution and let `PerformanceMonitor` earn the extra
 * pixels. Booting at the ceiling meant the most expensive frames of the whole
 * session (scene construction + shader warm-up) also rendered the most pixels.
 */
export const DPR_MIN = 1;
export const DPR_MAX = 1.5;

/**
 * Below `DPR_MIN`, used only once `WorldQualityGuard` has proven the device cannot hold
 * a frame rate. A quarter of the pixels is worth more than the sharpness at that point.
 */
export const DPR_DEGRADED = 0.5;

/** MIP levels for the bloom chain; each level costs a down- and an up-pass. */
export const BLOOM_LEVELS = 6;

export function dprForFactor(factor: number): number {
  const dpr = DPR_MIN + (DPR_MAX - DPR_MIN) * factor;
  return Math.round(dpr * 10) / 10;
}

export type WorldQuality = "full" | "reduced" | "frozen";

const TIERS: readonly WorldQuality[] = ["full", "reduced", "frozen"];

/**
 * The first frames of a session include scene construction and the first draw after
 * shader linking, which spike on any device. Judging those would degrade machines that
 * cope fine a second later.
 */
export const FRAME_GRACE_COUNT = 2;

/** ~4fps. Sustained, this is a page a visitor cannot scroll or click. */
export const FRAME_STRAINED_MS = 250;

export const FRAME_STRAINED_STREAK = 3;

/**
 * No functioning renderer produces a two-second frame. One is enough evidence on its own:
 * it means the main thread is blocked long enough that a click may never land.
 *
 * Such a frame skips straight to `frozen` rather than stepping down a tier. Waiting for
 * more evidence costs *another* frame of the same length — measured at ~5s each on CI's
 * software rasterizer, so a three-frame rule spent 15s of a 30s budget proving what the
 * first frame already showed — and no reduction in pixels or passes turns a five-second
 * frame into a usable one.
 */
export const FRAME_BROKEN_MS = 2_000;

export type FrameBudget = { observed: number; streak: number };

export function createFrameBudget(): FrameBudget {
  return { observed: 0, streak: 0 };
}

export function nextQuality(quality: WorldQuality): WorldQuality {
  return TIERS[TIERS.indexOf(quality) + 1] ?? quality;
}

export type FrameVerdict = "keep" | "step" | "freeze";

export function observeFrame(
  budget: FrameBudget,
  frameMs: number,
): { budget: FrameBudget; verdict: FrameVerdict } {
  const observed = budget.observed + 1;
  if (observed <= FRAME_GRACE_COUNT) return { budget: { observed, streak: 0 }, verdict: "keep" };

  if (frameMs >= FRAME_BROKEN_MS) return { budget: { observed, streak: 0 }, verdict: "freeze" };

  if (frameMs <= FRAME_STRAINED_MS) return { budget: { observed, streak: 0 }, verdict: "keep" };

  const streak = budget.streak + 1;
  if (streak < FRAME_STRAINED_STREAK) return { budget: { observed, streak }, verdict: "keep" };

  return { budget: { observed, streak: 0 }, verdict: "step" };
}

type WorldQualityGuardProps = {
  quality: WorldQuality;
  onDegrade: (quality: WorldQuality) => void;
};

/**
 * The world is decorative — `data-world-root` is `aria-hidden` and every destination is
 * reachable without it — so it must never cost the visitor the page. On a software
 * rasterizer (Chrome falls back to SwiftShader whenever the GPU is blocklisted, and CI
 * runs that way) this scene has been measured at **5s per frame**, which blocks the main
 * thread in chunks long enough that clicks and keystrokes are dropped entirely.
 *
 * `PerformanceMonitor` cannot help there: it only trades resolution between `DPR_MIN`
 * and `DPR_MAX`, and no pixel count rescues a renderer with no GPU behind it. So when
 * frames prove the device cannot cope, stop paying for the scene — first the
 * postprocessing chain, then the render loop itself.
 *
 * A CPU rasterizer is caught earlier and more cheaply, by `detectSoftwareRenderer` in
 * `WorldStage`; this is the net for hardware that is merely too slow, which nothing can
 * predict from a device string.
 *
 * Degradation is deliberately one-way. A device that has failed once will fail again,
 * and recovering would oscillate: freeing the main thread makes frames look healthy,
 * which would restore the load that broke them.
 */
export function WorldQualityGuard({ quality, onDegrade }: WorldQualityGuardProps): null {
  const budget = useRef(createFrameBudget());
  const previous = useRef(0);

  useEffect(() => {
    // rAF is paused while the tab is hidden, so the first frame back carries the whole
    // gap. That is a backgrounded tab, not a struggling renderer.
    const reset = (): void => {
      previous.current = 0;
    };
    document.addEventListener("visibilitychange", reset);
    return () => document.removeEventListener("visibilitychange", reset);
  }, []);

  useFrame(() => {
    const now = performance.now();
    const last = previous.current;
    previous.current = now;
    if (last === 0) return;

    const result = observeFrame(budget.current, now - last);
    budget.current = result.budget;
    if (result.verdict === "keep") return;

    const next = result.verdict === "freeze" ? "frozen" : nextQuality(quality);
    if (next === quality) return;
    onDegrade(next);
  });

  return null;
}

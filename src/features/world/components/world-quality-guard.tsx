"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  createFrameBudget,
  nextQuality,
  observeFrame,
  type WorldQuality,
} from "../utils/frame-budget";

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

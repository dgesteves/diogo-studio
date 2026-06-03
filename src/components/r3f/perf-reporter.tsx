"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { markPerfInactive, publishPerf } from "@/lib/telemetry/perf-store";

/**
 * In-Canvas perf sampler for the Inspector Overlay (S4).
 *
 * Reads `WebGLRenderer.info` and computes FPS over a ~250ms window, then
 * publishes to the module-level perf store ~4×/sec (not per-frame) so the
 * overlay can subscribe without re-rendering 60 times a second.
 *
 * Renders nothing. Mounted unconditionally inside the Canvas; since the
 * Canvas itself only mounts when motion is allowed and in-view, the store's
 * `active` flag naturally reflects whether a live scene exists.
 *
 * `info.render.*` reflects the previously rendered frame here (R3F runs
 * `useFrame` callbacks before its own `gl.render`), which is exactly what we
 * want to display — the cost of the last completed frame.
 */
export function PerfReporter() {
  const gl = useThree((state) => state.gl);
  const frames = useRef(0);
  const windowStart = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (windowStart.current === 0) windowStart.current = now;
    frames.current += 1;

    const elapsed = now - windowStart.current;
    if (elapsed >= 250) {
      const fps = (frames.current * 1000) / elapsed;
      const info = gl.info;
      publishPerf({
        fps: Math.round(fps),
        frameMs: Math.round((elapsed / frames.current) * 10) / 10,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length ?? 0,
      });
      frames.current = 0;
      windowStart.current = now;
    }
  });

  useEffect(() => {
    return () => markPerfInactive();
  }, []);

  return null;
}

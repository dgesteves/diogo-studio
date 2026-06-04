"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { markPerfInactive, publishPerf } from "@/lib/telemetry/perf-store";

export function PerfReporter(): null {
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

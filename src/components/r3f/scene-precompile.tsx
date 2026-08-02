"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/** Never let a stalled driver keep the scene hidden behind the boot screen. */
const COMPILE_TIMEOUT_MS = 8000;

/**
 * Warms up every material in the scene without blocking the main thread.
 *
 * `compileAsync` drives the `KHR_parallel_shader_compile` extension, so shader
 * linking happens on driver threads and readiness is polled instead of stalling
 * on `getProgramParameter`. drei's `<Preload all />` is deliberately avoided: it
 * calls the synchronous `gl.compile()` and then renders the whole scene six more
 * times through a `CubeCamera` inside a layout effect, only to throw it away.
 */
export function ScenePrecompile({ onCompiled }: { onCompiled: () => void }): null {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    let settled = false;
    const settle = (): void => {
      if (settled) return;
      settled = true;
      onCompiled();
    };

    const timer = window.setTimeout(settle, COMPILE_TIMEOUT_MS);
    void gl.compileAsync(scene, camera).then(settle, settle);

    return () => {
      settled = true;
      window.clearTimeout(timer);
    };
  }, [gl, scene, camera, onCompiled]);

  return null;
}

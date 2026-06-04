"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

/**
 * Mount inside any `<Canvas>` to guard against context loss.
 *
 * Without this, when the browser reclaims the WebGL context (HMR remount,
 * tab backgrounding, thermal throttling, GPU process restart on Chrome,
 * "too many active contexts"), the canvas goes black and stays black for
 * the rest of the session — and Chromium logs a bare
 * `THREE.WebGLRenderer: Context Lost.` with no remediation.
 *
 * The fix is small and well-known: call `event.preventDefault()` on the
 * `webglcontextlost` event. That contract tells the UA "I intend to
 * recover; please fire `webglcontextrestored` when you can," instead of
 * the default behavior of permanently dropping the context. Three.js's
 * internal restore path then rebinds shaders and textures and the scene
 * resumes on its own.
 *
 * We deliberately do nothing else (no toast, no error overlay). Context
 * loss in our scenes is recoverable and usually invisible to the user.
 */
export function WebGLContextGuard(): null {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;

    function onLost(event: Event) {
      event.preventDefault();
    }

    canvas.addEventListener("webglcontextlost", onLost, false);

    return () => {
      canvas.removeEventListener("webglcontextlost", onLost, false);
    };
  }, [gl]);

  return null;
}

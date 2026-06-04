"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

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

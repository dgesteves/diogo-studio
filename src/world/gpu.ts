"use client";

import { useEffect, useState } from "react";

/**
 * The GPU boundary: whether this machine has a real one, and releasing what the scene
 * takes from it. Both are the same question asked at the two ends of a session, and
 * `world/` is the only domain that asks either.
 */

/**
 * Chrome falls back to a CPU rasterizer (SwiftShader) whenever the GPU is unavailable or
 * blocklisted — old drivers, VMs, headless CI, some enterprise fleets. It reports itself
 * through the unmasked renderer string, so the decision to stop paying for an expensive
 * scene can be made before the first frame is ever drawn, rather than after the visitor
 * has sat through one.
 */
const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|softpipe|software|basic render/i;

export function isSoftwareRenderer(renderer: string | null): boolean {
  return renderer !== null && SOFTWARE_RENDERERS.test(renderer);
}

function readRendererName(gl: WebGLRenderingContext | WebGL2RenderingContext): string | null {
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const unmasked = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL as number)
    : gl.getParameter(gl.RENDERER);

  return typeof unmasked === "string" ? unmasked : null;
}

let probed: boolean | null = null;

/**
 * Probes a throwaway context so the answer is known *before* the scene mounts. Asking
 * from inside the canvas is too late: the first frames are the most expensive of the
 * session, and on a CPU rasterizer they have been measured at ~5s each — long enough to
 * drop clicks and keystrokes while the scene works out that it cannot cope.
 */
export function detectSoftwareRenderer(): boolean {
  if (probed !== null) return probed;
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
  probed = gl ? isSoftwareRenderer(readRendererName(gl)) : false;
  gl?.getExtension("WEBGL_lose_context")?.loseContext();

  return probed;
}

type Disposable = { dispose: () => void };

function isDisposable(value: unknown): value is Disposable {
  return (
    typeof value === "object" &&
    value !== null &&
    "dispose" in value &&
    typeof value.dispose === "function"
  );
}

/**
 * Every disposable the factory handed back, whether alone, in an array or on an object.
 * `Object.values` covers the array case too, so there is no separate branch for it.
 */
function disposablesIn(value: unknown): readonly Disposable[] {
  if (isDisposable(value)) return [value];
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(disposablesIn);
  }
  return [];
}

/**
 * Builds a GPU resource once and releases it when the component unmounts.
 *
 * R3F disposes what it reconciles from JSX, but a texture or geometry built imperatively
 * and passed in as a prop was never reconciled, so nothing else ever frees it. That matters
 * because the canvas really does unmount: `world-stage.tsx` drops the whole scene when a
 * visitor turns motion off mid-session, and without this every such toggle strands another
 * copy of the city and the television on the GPU.
 *
 * The factory replaces the `useMemo` it would otherwise be wrapped in, so a call site
 * cannot memoize the resource and forget the cleanup — or write the cleanup against an
 * array literal rebuilt every render, which disposes the live resource instead.
 *
 * It is held in state rather than a memo deliberately: React is free to discard a `useMemo`
 * and recompute it, which for a resource that has to be disposed by hand is the leak this
 * hook exists to close. A lazy `useState` initializer is the one that runs exactly once.
 */
export function useDisposable<T>(create: () => T): T {
  const [resource] = useState(() => create());

  useEffect(() => {
    const items = disposablesIn(resource);
    return () => {
      for (const item of items) item.dispose();
    };
  }, [resource]);

  return resource;
}

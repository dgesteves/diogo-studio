"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the memoized texture is intentionally mutated here.
 */

import { useEffect, useMemo, useState } from "react";
import type { CanvasTexture } from "three";
import { createCanvasTexture } from "@/features/studio/components/screens/canvas-texture";

import { drawLoungeTv, type LoungeTvState } from "./lounge-tv-screen-draw";

const TICK_MS = 110;

export function useLoungeTvTexture(): CanvasTexture {
  const { canvas, texture } = useMemo(() => createCanvasTexture(640, 360), []);
  const [state, setState] = useState<LoungeTvState>(() => ({ tick: 0 }));

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((prev) => ({ tick: prev.tick + 1 }));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawLoungeTv(ctx, state);
    texture.needsUpdate = true;
  }, [canvas, state, texture]);

  return texture;
}

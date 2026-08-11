"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the texture the hook holds is intentionally mutated here.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { CanvasTexture } from "three";
import { useDisposable } from "@/hooks/use-disposable";

import { createCanvasTexture } from "./canvas-texture";
import { drawTablet } from "./tablet-screen-draw";

const TEXTURE_WIDTH = 358;
const TEXTURE_HEIGHT = 512;
const REDRAW_INTERVAL = 1 / 15;
const STROKE_SECONDS = 5;
const HOLD_SECONDS = 1.8;

export function useTabletScreenTexture(): CanvasTexture {
  const { canvas, texture } = useDisposable(() =>
    createCanvasTexture(TEXTURE_WIDTH, TEXTURE_HEIGHT),
  );
  const elapsed = useRef(0);
  const sinceRedraw = useRef(REDRAW_INTERVAL);

  useFrame((_, delta) => {
    elapsed.current = (elapsed.current + delta) % (STROKE_SECONDS + HOLD_SECONDS);
    sinceRedraw.current += delta;
    if (sinceRedraw.current < REDRAW_INTERVAL) return;
    sinceRedraw.current = 0;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawTablet(ctx, {
      progress: Math.min(1, elapsed.current / STROKE_SECONDS),
      pressure: 0.5 + 0.5 * Math.sin(elapsed.current * 2.4),
    });
    texture.needsUpdate = true;
  });

  return texture;
}

"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the memoized texture is intentionally mutated here.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { CanvasTexture } from "three";

import { createCanvasTexture } from "./canvas-texture";
import { drawMetrics } from "./metrics-screen-draw";

const SPARK_LEN = 32;
const SAMPLE_SECONDS = 0.5;
const INITIAL_FPS = 60;

export function useRightScreenTexture(): CanvasTexture {
  const { canvas, texture } = useMemo(() => createCanvasTexture(640, 400), []);
  const frames = useRef(0);
  const elapsed = useRef(0);
  const history = useRef<number[]>(Array.from({ length: SPARK_LEN }, () => INITIAL_FPS));

  useFrame((state, delta) => {
    frames.current += 1;
    elapsed.current += delta;
    if (elapsed.current < SAMPLE_SECONDS) return;

    const fps = frames.current / elapsed.current;
    frames.current = 0;
    elapsed.current = 0;
    history.current = [...history.current.slice(1), fps];

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { domElement } = state.gl;
    drawMetrics(ctx, {
      fps,
      frameMs: 1000 / fps,
      history: history.current,
      resolution: `${domElement.width}×${domElement.height}`,
      dpr: state.gl.getPixelRatio(),
    });
    texture.needsUpdate = true;
  });

  return texture;
}

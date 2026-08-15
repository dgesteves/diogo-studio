"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { CanvasTexture } from "three";
import { useScreenTexture } from "@/world/screens/texture";

import { drawMetrics } from "./metrics-screen-draw";

const SPARK_LEN = 32;
const SAMPLE_SECONDS = 0.5;
const INITIAL_FPS = 60;

export function useRightScreenTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(640, 400);
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

    const { domElement } = state.gl;
    paint((ctx) =>
      drawMetrics(ctx, {
        fps,
        frameMs: 1000 / fps,
        history: history.current,
        resolution: `${domElement.width}×${domElement.height}`,
        dpr: state.gl.getPixelRatio(),
      }),
    );
  });

  return texture;
}

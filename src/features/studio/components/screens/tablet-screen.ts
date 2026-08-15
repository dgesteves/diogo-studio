"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { CanvasTexture } from "three";
import { useScreenTexture } from "@/world/screens/texture";

import { drawTablet } from "./tablet-screen-draw";

const TEXTURE_WIDTH = 358;
const TEXTURE_HEIGHT = 512;
const REDRAW_INTERVAL = 1 / 15;
const STROKE_SECONDS = 5;
const HOLD_SECONDS = 1.8;

export function useTabletScreenTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const elapsed = useRef(0);
  const sinceRedraw = useRef(REDRAW_INTERVAL);

  useFrame((_, delta) => {
    elapsed.current = (elapsed.current + delta) % (STROKE_SECONDS + HOLD_SECONDS);
    sinceRedraw.current += delta;
    if (sinceRedraw.current < REDRAW_INTERVAL) return;
    sinceRedraw.current = 0;

    paint((ctx) =>
      drawTablet(ctx, {
        progress: Math.min(1, elapsed.current / STROKE_SECONDS),
        pressure: 0.5 + 0.5 * Math.sin(elapsed.current * 2.4),
      }),
    );
  });

  return texture;
}

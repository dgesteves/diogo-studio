"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the texture the hook holds is intentionally mutated here.
 * This is the only file in `src/` that needs the exemption — every screen in the room
 * repaints through `paint` below.
 */

import { useCallback } from "react";
import * as THREE from "three";
import { useDisposable } from "../gpu";

/** A draw routine: it paints a screen and knows nothing about textures or three.js. */
export type ScreenDraw = (ctx: CanvasRenderingContext2D) => void;

export function createCanvasTexture(
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return { canvas, texture };
}

/**
 * One canvas-backed texture, built once and released with the component, plus the `paint`
 * that pushes new pixels to the GPU. Every screen in the room — monitors, tablet, wall
 * panels, the lounge television — differs only in what it draws and what makes it redraw:
 * an interval, a state change, or a frame callback. That difference stays at the call site;
 * everything above it is here.
 *
 * `paint` is memoized because four of the six callers list it as an effect dependency.
 */
export function useScreenTexture(
  width: number,
  height: number,
): { texture: THREE.CanvasTexture; paint: (draw: ScreenDraw) => void } {
  const { canvas, texture } = useDisposable(() => createCanvasTexture(width, height));

  const paint = useCallback(
    (draw: ScreenDraw) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      draw(ctx);
      texture.needsUpdate = true;
    },
    [canvas, texture],
  );

  return { texture, paint };
}

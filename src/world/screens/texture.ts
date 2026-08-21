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

export type CanvasTextureOptions = {
  /**
   * Build the mipmap chain, and filter through it.
   *
   * Off by default, which is what a screen wants: one is painted at about the density it is
   * rendered at, so the chain is memory for levels nothing samples and a regeneration on
   * every upload — and 9 px monospace goes soft the moment it is filtered through one.
   *
   * On for the other kind of canvas in this room: a surface painted once and then read
   * minified, at a glancing angle, from across the room. A mug's print, a coaster's face, a
   * shelf of book spines, the two home screens on the desk — sampled from the top level
   * alone, the band edges and the type on those crawl on every camera move.
   */
  mipmapped?: boolean;
};

/** Anisotropy for a mipmapped surface; three clamps it to what the device actually offers. */
const ANISOTROPY = 4;

export function createCanvasTexture(
  width: number,
  height: number,
  { mipmapped = false }: CanvasTextureOptions = {},
): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = mipmapped ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = mipmapped;
  if (mipmapped) texture.anisotropy = ANISOTROPY;
  return { canvas, texture };
}

/**
 * One canvas-backed texture, built once and released with the component, plus the `paint`
 * that pushes new pixels to the GPU. Every screen in the room — monitors, wall panels, the
 * lounge television, the phone and the tablet — differs only in what it draws and what makes
 * it redraw:
 * an interval, a state change, or a frame callback. That difference stays at the call site;
 * everything above it is here.
 *
 * `paint` is memoized because four of the six callers list it as an effect dependency.
 */
export function useScreenTexture(
  width: number,
  height: number,
  options?: CanvasTextureOptions,
): { texture: THREE.CanvasTexture; paint: (draw: ScreenDraw) => void } {
  const { canvas, texture } = useDisposable(() => createCanvasTexture(width, height, options));

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

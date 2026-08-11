"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the texture the hook holds is intentionally mutated here.
 */

import { useEffect, useState } from "react";
import type { CanvasTexture } from "three";
import { useDisposable } from "@/hooks/use-disposable";

import { createCanvasTexture } from "./canvas-texture";
import { drawCode } from "./code-screen-draw";

export function useLeftScreenTexture(): CanvasTexture {
  const { canvas, texture } = useDisposable(() => createCanvasTexture(640, 400));
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => setCaretOn((on) => !on), 600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCode(ctx, caretOn);
    texture.needsUpdate = true;
  }, [canvas, caretOn, texture]);

  return texture;
}

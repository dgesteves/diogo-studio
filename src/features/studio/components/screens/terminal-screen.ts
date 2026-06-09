"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the memoized texture is intentionally mutated here.
 */

import { useEffect, useMemo, useState } from "react";
import type { CanvasTexture } from "three";

import { createCanvasTexture } from "./canvas-texture";
import { LOG_POOL, type LogLine } from "./terminal-screen-data";
import { drawTerminal } from "./terminal-screen-draw";

export function useCenterScreenTexture(): CanvasTexture {
  const { canvas, texture } = useMemo(() => createCanvasTexture(640, 400), []);
  const [lines, setLines] = useState<LogLine[]>(() => LOG_POOL.slice(0, 8));

  useEffect(() => {
    let i = 8;
    const id = window.setInterval(() => {
      setLines((prev) => {
        const next = prev.slice(1);
        const line = LOG_POOL[i % LOG_POOL.length];
        if (line) next.push(line);
        i += 1;
        return next;
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawTerminal(ctx, lines);
    texture.needsUpdate = true;
  }, [canvas, lines, texture]);

  return texture;
}

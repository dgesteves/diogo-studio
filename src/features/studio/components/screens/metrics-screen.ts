"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the memoized texture is intentionally mutated here.
 */

import { useEffect, useMemo, useState } from "react";
import type { CanvasTexture } from "three";

import { createCanvasTexture } from "./canvas-texture";
import { drawMetrics } from "./metrics-screen-draw";

const SPARK_LEN = 22;

function driftSeries(series: number[]): number[] {
  const next = series.slice(1);
  const last = series[series.length - 1] ?? 0.5;
  const target = 0.5 + (Math.random() - 0.5) * 0.45;
  next.push(last + (target - last) * 0.55);
  return next;
}

export function useRightScreenTexture(): CanvasTexture {
  const { canvas, texture } = useMemo(() => createCanvasTexture(640, 400), []);
  const [series, setSeries] = useState(() => ({
    req: Array.from({ length: SPARK_LEN }, () => 0.4 + Math.random() * 0.5),
    lat: Array.from({ length: SPARK_LEN }, () => 0.4 + Math.random() * 0.5),
    err: Array.from({ length: SPARK_LEN }, () => 0.4 + Math.random() * 0.5),
  }));

  useEffect(() => {
    const idReq = window.setInterval(
      () => setSeries((s) => ({ ...s, req: driftSeries(s.req) })),
      1200,
    );
    const idLat = window.setInterval(
      () => setSeries((s) => ({ ...s, lat: driftSeries(s.lat) })),
      1500,
    );
    const idErr = window.setInterval(
      () => setSeries((s) => ({ ...s, err: driftSeries(s.err) })),
      2200,
    );
    return () => {
      window.clearInterval(idReq);
      window.clearInterval(idLat);
      window.clearInterval(idErr);
    };
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawMetrics(ctx, series);
    texture.needsUpdate = true;
  }, [canvas, series, texture]);

  return texture;
}

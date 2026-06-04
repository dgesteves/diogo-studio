"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the memoized texture is intentionally mutated here.
 */

import { useEffect, useMemo, useState } from "react";
import type { CanvasTexture } from "three";

import { brandColors } from "@/config/brand";
import { MONO, createCanvasTexture } from "./canvas-texture";

const SPARK_LEN = 22;

function drawMetrics(
  ctx: CanvasRenderingContext2D,
  series: { req: number[]; lat: number[]; err: number[] },
): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.fillStyle = "#03080c";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(34, 211, 238, 0.025)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  ctx.textBaseline = "top";
  ctx.fillStyle = brandColors.accent;
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("● SIGNALS · LAST 30M", 30, 30);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 70);
  ctx.lineTo(W - 30, 70);
  ctx.stroke();

  const latest = (s: number[]): number => s[s.length - 1] ?? 0.5;
  const rows = [
    {
      label: "REQ/MIN",
      value: String(Math.round(620 + latest(series.req) * 280)),
      color: brandColors.accent,
      data: series.req,
    },
    {
      label: "P95 ms",
      value: String(Math.round(110 + latest(series.lat) * 40)),
      color: brandColors.accentSoft,
      data: series.lat,
    },
    {
      label: "ERR %",
      value: (latest(series.err) * 0.18).toFixed(2),
      color: "#a5f3fc",
      data: series.err,
    },
  ];

  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    if (!row) continue;
    const y = 96 + r * 96;

    ctx.fillStyle = "rgba(232,246,252,0.55)";
    ctx.font = `16px ${MONO}`;
    ctx.fillText(row.label, 30, y);

    ctx.fillStyle = "#e8f6fc";
    ctx.font = `bold 36px ${MONO}`;
    ctx.fillText(row.value, 30, y + 22);

    const sparkX = 260;
    const sparkY = y + 12;
    const sparkW = W - sparkX - 30;
    const sparkH = 56;
    ctx.strokeStyle = row.color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < row.data.length; i += 1) {
      const value = row.data[i];
      if (value === undefined) continue;
      const x = sparkX + (i / Math.max(row.data.length - 1, 1)) * sparkW;
      const dy = sparkY + (1 - Math.max(0, Math.min(1, value))) * sparkH;
      if (i === 0) ctx.moveTo(x, dy);
      else ctx.lineTo(x, dy);
    }
    ctx.stroke();

    const lastValue = row.data[row.data.length - 1] ?? 0;
    const lastY = sparkY + (1 - Math.max(0, Math.min(1, lastValue))) * sparkH;
    ctx.fillStyle = row.color;
    ctx.beginPath();
    ctx.arc(sparkX + sparkW, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

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

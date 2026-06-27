"use client";

/* eslint-disable react-hooks/immutability --
 * CanvasTexture's `needsUpdate = true` marks the canvas pixels dirty so three.js
 * re-uploads them to the GPU; the memoized texture is intentionally mutated here.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { CanvasTexture } from "three";

import { createCanvasTexture } from "./canvas-texture";
import { FOCUS_POOL, STATUS_ROWS } from "./terminal-screen-data";
import { drawTerminal } from "./terminal-screen-draw";

const FOCUS_INTERVAL_MS = 3000;

const LISBON_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Lisbon",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const LISBON_DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Lisbon",
  weekday: "short",
  day: "2-digit",
  month: "short",
});

function formatUptime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export function useCenterScreenTexture(): CanvasTexture {
  const { canvas, texture } = useMemo(() => createCanvasTexture(640, 400), []);
  const bootAt = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    bootAt.current = Date.now();
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const focus = FOCUS_POOL[Math.floor(now / FOCUS_INTERVAL_MS) % FOCUS_POOL.length] ?? "";
    drawTerminal(ctx, {
      rows: STATUS_ROWS,
      time: LISBON_TIME.format(now),
      date: LISBON_DATE.format(now),
      uptime: formatUptime(now - (bootAt.current ?? now)),
      focus,
    });
    texture.needsUpdate = true;
  }, [canvas, texture, now]);

  return texture;
}

"use client";

import { useEffect, useRef, type ReactElement } from "react";

import { brand } from "@/ui/brand";

/**
 * The portrait's canvas, whole: the component, the loop that drives it, the sampler that
 * turns an image into cells and the frame that draws them. It is one module because
 * `portrait.tsx` loads it with `next/dynamic` — this file is the chunk, and every part of
 * it is only ever reached through the component at the top.
 */

const MAX_DPR = 2;
const DEFAULT_CELL_SIZE = 7;

export const CELL_GAP = 1;
export const DISTURB_RADIUS_RATIO = 0.42;
const REPEL_STRENGTH = 2.4;
const SPRING_PULL = 0.1;
const DAMPING = 0.82;
const TINT_STRENGTH = 0.7;
const AMBIENT_AMPLITUDE = 0.9;
const AMBIENT_SPEED = 0.0015;

export type Pointer = { x: number; y: number; active: boolean };
type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export const TINT = hexToRgb(brand.accent);

type PortraitEngineOptions = {
  src: string;
  cellSize: number;
  interactive: boolean;
  onLoaded?: () => void;
  onError?: () => void;
};

export type PortraitCanvasProps = {
  src: string;
  cellSize?: number;
  interactive?: boolean;
  onLoaded?: () => void;
  onError?: () => void;
};

export function PortraitCanvas({
  src,
  cellSize = DEFAULT_CELL_SIZE,
  interactive = true,
  onLoaded,
  onError,
}: PortraitCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return createPortraitEngine(canvas, { src, cellSize, interactive, onLoaded, onError });
  }, [src, cellSize, interactive, onLoaded, onError]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}

export function createPortraitEngine(
  canvas: HTMLCanvasElement,
  options: PortraitEngineOptions,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const context: CanvasRenderingContext2D = ctx;

  let image: HTMLImageElement | null = null;
  let cells: Cell[] = [];
  let dims: Dims | null = null;
  let rafId = 0;
  let visible = true;
  const pointer: Pointer = { x: 0, y: 0, active: false };

  function rebuild(): void {
    if (!image) return;
    const result = sampleGrid(canvas, image, options.cellSize);
    if (result) {
      cells = result.cells;
      dims = result.dims;
    }
  }

  function renderFrame(time: number): boolean {
    if (!dims) return false;
    return drawPortraitFrame(context, {
      cells,
      dims,
      pointer,
      interactive: options.interactive,
      time,
    });
  }

  function loop(time: number): void {
    if (!visible) {
      rafId = 0;
      return;
    }
    rafId = renderFrame(time) ? requestAnimationFrame(loop) : 0;
  }

  function kick(): void {
    if (!rafId && visible) rafId = requestAnimationFrame(loop);
  }

  function handlePointerMove(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    kick();
  }

  function handlePointerLeave(): void {
    pointer.active = false;
    kick();
  }

  const resizeObserver = new ResizeObserver(() => {
    rebuild();
    kick();
  });
  resizeObserver.observe(canvas);

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) kick();
    },
    { threshold: 0 },
  );
  visibilityObserver.observe(canvas);

  const img = new Image();
  image = img;
  img.decoding = "async";
  img.onload = () => {
    rebuild();
    options.onLoaded?.();
    kick();
  };
  img.onerror = () => options.onError?.();
  img.src = options.src;

  if (options.interactive) {
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
  }

  return () => {
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerleave", handlePointerLeave);
    img.onload = null;
    img.onerror = null;
  };
}

export type Cell = {
  bx: number;
  by: number;
  r: number;
  g: number;
  b: number;
  a: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  phase: number;
};

export type Dims = { width: number; height: number; cellW: number; cellH: number; dpr: number };

type GridResult = { cells: Cell[]; dims: Dims };

export function sampleGrid(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  cellSize: number,
): GridResult | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  const cols = Math.max(1, Math.floor(rect.width / cellSize));
  const rows = Math.max(1, Math.floor(rect.height / cellSize));

  const sampler = document.createElement("canvas");
  sampler.width = cols;
  sampler.height = rows;
  const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
  if (!samplerCtx) return null;

  const scale = Math.max(cols / image.width, rows / image.height);
  const cropW = cols / scale;
  const cropH = rows / scale;
  samplerCtx.drawImage(
    image,
    (image.width - cropW) / 2,
    (image.height - cropH) / 2,
    cropW,
    cropH,
    0,
    0,
    cols,
    rows,
  );

  const data = samplerCtx.getImageData(0, 0, cols, rows).data;
  const cellW = rect.width / cols;
  const cellH = rect.height / rows;

  const cells: Cell[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const i = (y * cols + x) * 4;
      cells.push({
        bx: x * cellW,
        by: y * cellH,
        r: data[i] ?? 0,
        g: data[i + 1] ?? 0,
        b: data[i + 2] ?? 0,
        a: (data[i + 3] ?? 255) / 255,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
        phase: x * 0.6 + y * 0.45,
      });
    }
  }

  return { cells, dims: { width: rect.width, height: rect.height, cellW, cellH, dpr } };
}

type FrameParams = {
  cells: Cell[];
  dims: Dims;
  pointer: Pointer;
  interactive: boolean;
  time: number;
};

/**
 * One frame. The loop above stops when this returns `false`, which is the battery contract:
 * a portrait nobody is pointing at, with motion turned off, settles rather than spinning.
 */
export function drawPortraitFrame(
  context: CanvasRenderingContext2D,
  { cells, dims, pointer, interactive, time }: FrameParams,
): boolean {
  context.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
  context.clearRect(0, 0, dims.width, dims.height);
  const radius = Math.min(dims.width, dims.height) * DISTURB_RADIUS_RATIO;
  const ambient = interactive ? AMBIENT_AMPLITUDE : 0;

  for (const cell of cells) {
    let { r, g, b } = cell;
    const targetX = ambient * Math.sin(time * AMBIENT_SPEED + cell.phase);
    const targetY = ambient * Math.cos(time * AMBIENT_SPEED * 0.9 + cell.phase);
    if (pointer.active) {
      const dx = cell.bx + dims.cellW / 2 - pointer.x;
      const dy = cell.by + dims.cellH / 2 - pointer.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      if (dist < radius) {
        const falloff = 1 - dist / radius;
        cell.vx += (dx / dist) * falloff * REPEL_STRENGTH;
        cell.vy += (dy / dist) * falloff * REPEL_STRENGTH;
        const t = falloff * TINT_STRENGTH;
        r = Math.round(r + (TINT.r - r) * t);
        g = Math.round(g + (TINT.g - g) * t);
        b = Math.round(b + (TINT.b - b) * t);
      }
    }
    cell.vx = (cell.vx + (targetX - cell.ox) * SPRING_PULL) * DAMPING;
    cell.vy = (cell.vy + (targetY - cell.oy) * SPRING_PULL) * DAMPING;
    cell.ox += cell.vx;
    cell.oy += cell.vy;
    context.globalAlpha = cell.a;
    context.fillStyle = `rgb(${r},${g},${b})`;
    context.fillRect(
      cell.bx + cell.ox,
      cell.by + cell.oy,
      dims.cellW - CELL_GAP,
      dims.cellH - CELL_GAP,
    );
  }
  context.globalAlpha = 1;
  return interactive || pointer.active;
}

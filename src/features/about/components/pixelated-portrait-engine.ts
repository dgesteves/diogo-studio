import { brandColors } from "@/config/brand";
import { sampleGrid, type Cell, type Dims } from "./pixelated-portrait-sampler";

const CELL_GAP = 1;
const DISTURB_RADIUS_RATIO = 0.42;
const REPEL_STRENGTH = 2.4;
const SPRING_PULL = 0.1;
const DAMPING = 0.82;
const TINT_STRENGTH = 0.7;
const AMBIENT_AMPLITUDE = 0.9;
const AMBIENT_SPEED = 0.0015;

type Pointer = { x: number; y: number; active: boolean };
type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

const TINT = hexToRgb(brandColors.accent);

export type PortraitEngineOptions = {
  src: string;
  cellSize: number;
  interactive: boolean;
  onLoaded?: () => void;
  onError?: () => void;
};

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
    context.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
    context.clearRect(0, 0, dims.width, dims.height);
    const radius = Math.min(dims.width, dims.height) * DISTURB_RADIUS_RATIO;
    const ambient = options.interactive ? AMBIENT_AMPLITUDE : 0;

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
    return options.interactive || pointer.active;
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

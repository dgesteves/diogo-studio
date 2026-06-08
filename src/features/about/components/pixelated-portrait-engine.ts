import { sampleGrid, type Cell, type Dims } from "./pixelated-portrait-sampler";
import { type Pointer, type PortraitEngineOptions } from "./pixelated-portrait-engine-config";
import { drawPortraitFrame } from "./pixelated-portrait-frame";

export type { PortraitEngineOptions };

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

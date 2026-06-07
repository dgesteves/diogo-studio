"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { createPortraitEngine } from "./pixelated-portrait-engine";

const DEFAULT_CELL_SIZE = 7;

export type PixelatedPortraitCanvasProps = {
  src: string;
  cellSize?: number;
  interactive?: boolean;
  onLoaded?: () => void;
  onError?: () => void;
};

export function PixelatedPortraitCanvas({
  src,
  cellSize = DEFAULT_CELL_SIZE,
  interactive = true,
  onLoaded,
  onError,
}: PixelatedPortraitCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return createPortraitEngine(canvas, { src, cellSize, interactive, onLoaded, onError });
  }, [src, cellSize, interactive, onLoaded, onError]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}

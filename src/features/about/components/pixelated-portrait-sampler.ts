const MAX_DPR = 2;

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

export type GridResult = { cells: Cell[]; dims: Dims };

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

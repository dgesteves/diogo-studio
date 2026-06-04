import * as THREE from "three";

const FALLBACK = new THREE.Color("#22d3ee");

let probeCanvas: HTMLCanvasElement | null = null;
let probeCtx: CanvasRenderingContext2D | null = null;

function getProbeCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (probeCtx) return probeCtx;
  probeCanvas = document.createElement("canvas");
  probeCanvas.width = 1;
  probeCanvas.height = 1;
  probeCtx = probeCanvas.getContext("2d", {
    colorSpace: "srgb",
    willReadFrequently: true,
  });
  return probeCtx;
}

export function resolveCssColor(cssColor: string): THREE.Color {
  const ctx = getProbeCtx();
  if (!ctx) return FALLBACK.clone();
  try {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1, { colorSpace: "srgb" }).data;
    const r = (data[0] ?? 0) / 255;
    const g = (data[1] ?? 0) / 255;
    const b = (data[2] ?? 0) / 255;
    return new THREE.Color(r, g, b);
  } catch {
    return FALLBACK.clone();
  }
}

export function resolveCssVarColor(varName: string): THREE.Color {
  if (typeof window === "undefined") return FALLBACK.clone();
  try {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(varName.startsWith("--") ? varName : `--${varName}`)
      .trim();
    if (!raw) return FALLBACK.clone();
    return resolveCssColor(raw);
  } catch {
    return FALLBACK.clone();
  }
}

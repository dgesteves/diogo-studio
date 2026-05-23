import * as THREE from "three";

/**
 * Resolve a CSS color value (named, hex, rgb, hsl, OKLCH, lab, lch, …) to a
 * `THREE.Color`.
 *
 * Why this exists: our design tokens are OKLCH. Modern browsers serialize
 * `getComputedStyle()` reads of OKLCH values verbatim, and even
 * `canvas.fillStyle` setters round-trip to `lab()` / `oklch()` strings.
 * `THREE.Color` only parses sRGB-family CSS (hex, rgb, hsl, named) and
 * throws on the modern formats.
 *
 * Reliable cross-browser trick: actually *rasterize* the color into a 1×1
 * canvas, then call `getImageData()` which is specified to return sRGB
 * regardless of the source color space.
 *
 * Falls back to a sane accent color if anything goes wrong (SSR, sandboxed
 * iframe, canvas disabled, …) so the scene never throws.
 */
const FALLBACK = new THREE.Color("#22d3ee");

let probeCanvas: HTMLCanvasElement | null = null;
let probeCtx: CanvasRenderingContext2D | null = null;

function getProbeCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (probeCtx) return probeCtx;
  probeCanvas = document.createElement("canvas");
  probeCanvas.width = 1;
  probeCanvas.height = 1;
  // - `colorSpace: "srgb"` so getImageData() returns sRGB bytes even on
  //   wide-gamut displays.
  // - `willReadFrequently: true` is a hint to the browser that we do many
  //   `getImageData()` reads against this context — without it Chromium
  //   logs a Canvas2D perf warning on each invocation. We resolve one
  //   color per CSS variable per scene mount, so the hint costs nothing
  //   and silences the warning.
  probeCtx = probeCanvas.getContext("2d", {
    colorSpace: "srgb",
    willReadFrequently: true,
  });
  return probeCtx;
}

/** Resolve any valid CSS color string to a `THREE.Color` in sRGB. */
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

/**
 * Resolve a CSS custom property (e.g. `--accent`) on `:root` to a THREE.Color.
 */
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

import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

const TEXTURE_SIZE = 256;

let cached: CanvasTexture | null = null;

export function createRadialGlowTexture(): CanvasTexture {
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    const half = TEXTURE_SIZE / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  cached = texture;
  return texture;
}

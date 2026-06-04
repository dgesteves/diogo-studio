import * as THREE from "three";

// Screens render into an offscreen <canvas> wrapped in a CanvasTexture (used as
// map + emissiveMap) rather than drei's <Html transform>, which is unreliable
// behind the bloom pass and across browsers.

export const MONO = `"Geist Mono", ui-monospace, Menlo, Consolas, monospace`;

export function createCanvasTexture(
  width: number,
  height: number,
): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return { canvas, texture };
}

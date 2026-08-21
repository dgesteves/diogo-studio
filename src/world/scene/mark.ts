"use client";

import { type CanvasTexture } from "three";
import { createCanvasTexture } from "../screens/texture";

/**
 * The mark on a lid, painted rather than modeled — struck once by the Mac Studio on the desk
 * and once by the MacBook standing on the lounge table. It moved here when the second one
 * appeared, the way `scene/slab.ts` left the phone and `scene/shell.ts` left the mouse.
 *
 * Only the picture is shared. How big it is printed and what finish it takes belong to the
 * object printing it: the two lids are different aluminums under different lights, and a
 * single `MARK` preset would make one of them wrong.
 *
 * Two lobes flooded together, then the valley and the bite punched back out of them. A
 * silhouette this shape has no inside to trace — the bite is a piece missing from the
 * outline, not a hole in a face — so cutting is the operation that describes it, and the leaf
 * is the one piece drawn on top afterwards.
 */

const MARK_PIXELS = 128;

export function paintMark(ctx: CanvasRenderingContext2D): void {
  const size = ctx.canvas.width;
  const unit = size / 100;
  const x = size / 2;
  const y = size * 0.57;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * 14 * unit, y, 26 * unit, 29 * unit, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // The lobes are round at the foot and the fruit is not, so the base is drawn across them.
  ctx.beginPath();
  ctx.ellipse(x, y + 16 * unit, 25 * unit, 17 * unit, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.ellipse(x, y - 33 * unit, 12 * unit, 11 * unit, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 45 * unit, y - 3 * unit, 15 * unit, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // The leaf, leaning right out of the valley: two arcs meeting at a point at either end.
  ctx.beginPath();
  ctx.moveTo(x + unit, y - 29 * unit);
  ctx.quadraticCurveTo(x + 6 * unit, y - 49 * unit, x + 19 * unit, y - 51 * unit);
  ctx.quadraticCurveTo(x + 14 * unit, y - 33 * unit, x + unit, y - 29 * unit);
  ctx.fill();
}

export function createMarkTexture(): CanvasTexture {
  const { canvas, texture } = createCanvasTexture(MARK_PIXELS, MARK_PIXELS, {
    // Read at a glancing angle from across the room and never repainted: the same case as a
    // book's cloth.
    mipmapped: true,
  });
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  paintMark(ctx);
  texture.needsUpdate = true;
  return texture;
}

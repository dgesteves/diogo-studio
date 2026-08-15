"use client";

import type { CanvasTexture } from "three";
import { brandColors } from "@/config/brand";
import { useDisposable } from "@/hooks/use-disposable";

import { createCanvasTexture } from "@/world/screens/texture";
import { MONO } from "@/world/screens/kit";
import { KEYCAPS, KEYCAP_DEPTH, KEY_FIELD_DEPTH, KEY_FIELD_WIDTH } from "./keyboard-layout";

const PIXELS_PER_METER = 1500;
const TEXTURE_WIDTH = Math.round(KEY_FIELD_WIDTH * PIXELS_PER_METER);
const TEXTURE_HEIGHT = Math.round(KEY_FIELD_DEPTH * PIXELS_PER_METER);
const FONT_SIZE = KEYCAP_DEPTH * PIXELS_PER_METER * 0.4;
const SMALL_LABEL_SCALE = 0.68;
const LONG_LABEL_LENGTH = 2;

function drawLegends(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = brandColors.accentSoft;
  ctx.shadowColor = brandColors.accent;
  ctx.shadowBlur = FONT_SIZE * 0.8;

  for (const cap of KEYCAPS) {
    if (!cap.label) continue;
    const isLong = cap.label.length > LONG_LABEL_LENGTH;
    ctx.font = `${isLong ? FONT_SIZE * SMALL_LABEL_SCALE : FONT_SIZE}px ${MONO}`;
    ctx.fillText(
      cap.label,
      (cap.x + KEY_FIELD_WIDTH / 2) * PIXELS_PER_METER,
      (cap.z + KEY_FIELD_DEPTH / 2) * PIXELS_PER_METER,
    );
  }
}

export function useKeyboardLegendTexture(): CanvasTexture {
  return useDisposable(() => {
    const { canvas, texture } = createCanvasTexture(TEXTURE_WIDTH, TEXTURE_HEIGHT);
    const ctx = canvas.getContext("2d");
    if (ctx) drawLegends(ctx);
    return texture;
  });
}

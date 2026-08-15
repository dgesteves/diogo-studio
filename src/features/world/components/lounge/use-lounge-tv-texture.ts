"use client";

import { useEffect, useState } from "react";
import type { CanvasTexture } from "three";
import { useScreenTexture } from "@/world/screens/texture";

import { drawLoungeTv, type LoungeTvState } from "./lounge-tv-screen-draw";

const TICK_MS = 110;

export function useLoungeTvTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(640, 360);
  const [state, setState] = useState<LoungeTvState>(() => ({ tick: 0 }));

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((prev) => ({ tick: prev.tick + 1 }));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    paint((ctx) => drawLoungeTv(ctx, state));
  }, [paint, state]);

  return texture;
}

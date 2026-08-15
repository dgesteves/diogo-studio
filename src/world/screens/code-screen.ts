"use client";

import { useEffect, useState } from "react";
import type { CanvasTexture } from "three";
import { useScreenTexture } from "@/world/screens/texture";

import { drawCode } from "./code-screen-draw";

export function useLeftScreenTexture(): CanvasTexture {
  const { texture, paint } = useScreenTexture(640, 400);
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => setCaretOn((on) => !on), 600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    paint((ctx) => drawCode(ctx, caretOn));
  }, [paint, caretOn]);

  return texture;
}

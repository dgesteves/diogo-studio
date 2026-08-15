"use client";

import { useSyncExternalStore } from "react";
import { worldPalettes, type WorldPalette } from "@/config/world-theme";
import {
  getWorldModeServerSnapshot,
  getWorldModeSnapshot,
  subscribeWorldTheme,
} from "@/world/store";

export function useWorldPalette(): WorldPalette {
  const mode = useSyncExternalStore(
    subscribeWorldTheme,
    getWorldModeSnapshot,
    getWorldModeServerSnapshot,
  );
  return worldPalettes[mode];
}

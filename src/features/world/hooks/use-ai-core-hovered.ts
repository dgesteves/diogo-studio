"use client";

import { useSyncExternalStore } from "react";
import { getWorldServerSnapshot, getWorldSnapshot, subscribeWorld } from "@/stores/world-store";

export function useAiCoreHovered(): boolean {
  const state = useSyncExternalStore(subscribeWorld, getWorldSnapshot, getWorldServerSnapshot);
  return state.aiCoreHovered;
}

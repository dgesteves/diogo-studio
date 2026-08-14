"use client";

import { useSyncExternalStore } from "react";
import type { RouteKey } from "@/content/pages";
import { getWorldServerSnapshot, getWorldSnapshot, subscribeWorld } from "@/stores/world-store";

export function useHoveredStation(): RouteKey | null {
  const state = useSyncExternalStore(subscribeWorld, getWorldSnapshot, getWorldServerSnapshot);
  return state.hovered;
}

"use client";

import { useSyncExternalStore } from "react";
import { getExploreServerSnapshot, getExploreSnapshot, subscribeExplore } from "@/world/store";

export function useExplore(): boolean {
  return useSyncExternalStore(subscribeExplore, getExploreSnapshot, getExploreServerSnapshot);
}

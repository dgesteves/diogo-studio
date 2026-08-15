import { setInspectorOpen } from "@/features/inspector/overlay-store";

import { getPerfServerSnapshot, markPerfInactive, publishPerf } from "@/world/perf";
import { persistOverride } from "@/reduced-motion";
import {
  getExploreServerSnapshot,
  getWorldModeServerSnapshot,
  getWorldServerSnapshot,
  setAiCoreHovered,
  setExplore,
  setHoveredStation,
  setWorldMode,
  resetBoot,
} from "@/world/store";

// Every store below is a module singleton read through `useSyncExternalStore`, so state
// set by one test file is visible to the next. The server snapshots are the canonical
// initial values, which keeps this from restating defaults the stores already own.
export function resetStores(): void {
  resetBoot();
  setExplore(getExploreServerSnapshot());

  const world = getWorldServerSnapshot();
  setHoveredStation(world.hovered);
  setAiCoreHovered(world.aiCoreHovered);

  setWorldMode(getWorldModeServerSnapshot());
  setInspectorOpen(false);
  persistOverride(null);

  // `world/perf` has no whole-snapshot setter, and publishing implies a live scene, so the
  // two calls together are what restores it: the server snapshot's zeroes, then inactive.
  publishPerf(getPerfServerSnapshot());
  markPerfInactive();

  window.sessionStorage.clear();
  window.localStorage.clear();
}

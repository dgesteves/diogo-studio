import { setInspectorOpen } from "@/features/inspector/stores/inspector-overlay-store";
import { resetBoot } from "@/stores/boot-store";
import { getExploreServerSnapshot, setExplore } from "@/stores/explore-store";
import { persistOverride } from "@/stores/reduced-motion-store";
import { getWorldServerSnapshot, setAiCoreHovered, setHoveredStation } from "@/stores/world-store";
import { getWorldModeServerSnapshot, setWorldMode } from "@/stores/world-theme-store";

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

  window.sessionStorage.clear();
  window.localStorage.clear();
}

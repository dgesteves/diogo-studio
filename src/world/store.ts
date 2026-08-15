import type { RouteKey } from "@/content/pages";
import { createStore } from "@/store";

/**
 * What the room is doing right now: what the pointer is over, whether it is day or night, and
 * whether the visitor has taken the camera off the rails. Three signals rather than one object,
 * because the HUD deck reads all three and a hover must not re-render the sky.
 *
 * This module is the world's public API to its siblings; every other file under `world/` is
 * private to it — `docs/refactor.md` §4.2.
 */

type WorldState = {
  hovered: RouteKey | null;
  aiCoreHovered: boolean;
};

export type WorldMode = "day" | "night";

const world = createStore<WorldState>({ hovered: null, aiCoreHovered: false });
const worldMode = createStore<WorldMode>("night");
const explore = createStore(false);

export function setHoveredStation(slug: RouteKey | null): void {
  world.update((prev) => (prev.hovered === slug ? prev : { ...prev, hovered: slug }));
}

export function setAiCoreHovered(value: boolean): void {
  world.update((prev) => (prev.aiCoreHovered === value ? prev : { ...prev, aiCoreHovered: value }));
}

export const subscribeWorld = world.subscribe;
export const getWorldSnapshot = world.get;
export const getWorldServerSnapshot = world.getServer;

export const setWorldMode = worldMode.set;
export const subscribeWorldTheme = worldMode.subscribe;
export const getWorldModeSnapshot = worldMode.get;
export const getWorldModeServerSnapshot = worldMode.getServer;

export const setExplore = explore.set;
export const subscribeExplore = explore.subscribe;
export const getExploreSnapshot = explore.get;
export const getExploreServerSnapshot = explore.getServer;

export function toggleExplore(): void {
  explore.update((active) => !active);
}

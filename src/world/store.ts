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

/**
 * How far the world has loaded and whether it is ready. A separate signal because it has a
 * separate lifetime — it runs once at startup and nothing reads it afterwards — but it lives
 * here rather than beside the boot overlay it drives: the canvas publishes it, the overlay
 * consumes it, and a store nothing can import without pulling in a DOM overlay is not a store.
 */
type BootSignal = { progress: number; ready: boolean };

const boot = createStore<BootSignal>({ progress: 0, ready: false });

export function setBootProgress(progress: number): void {
  const next = Math.max(0, Math.min(100, Math.round(progress)));
  boot.update((prev) => (prev.progress === next ? prev : { ...prev, progress: next }));
}

export function markWorldReady(): void {
  boot.update((prev) => (prev.ready ? prev : { ...prev, ready: true }));
}

export function resetBoot(): void {
  boot.set(boot.getServer());
}

export const subscribeBoot = boot.subscribe;
export const getBootSnapshot = boot.get;
export const getBootServerSnapshot = boot.getServer;

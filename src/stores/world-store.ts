import type { RouteKey } from "@/content/pages";

export type WorldState = {
  hovered: RouteKey | null;
  aiCoreHovered: boolean;
};

const INITIAL: WorldState = { hovered: null, aiCoreHovered: false };

let state: WorldState = INITIAL;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setHoveredStation(slug: RouteKey | null): void {
  if (state.hovered === slug) return;
  state = { ...state, hovered: slug };
  emit();
}

export function setAiCoreHovered(value: boolean): void {
  if (state.aiCoreHovered === value) return;
  state = { ...state, aiCoreHovered: value };
  emit();
}

export function subscribeWorld(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getWorldSnapshot(): WorldState {
  return state;
}

export function getWorldServerSnapshot(): WorldState {
  return INITIAL;
}

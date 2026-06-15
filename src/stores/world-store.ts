import type { RouteKey } from "@/constants/routes";

export type WorldState = {
  hovered: RouteKey | null;
};

const INITIAL: WorldState = { hovered: null };

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

let active = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setExplore(next: boolean): void {
  if (active === next) return;
  active = next;
  emit();
}

export function toggleExplore(): void {
  setExplore(!active);
}

export function subscribeExplore(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getExploreSnapshot(): boolean {
  return active;
}

export function getExploreServerSnapshot(): boolean {
  return false;
}

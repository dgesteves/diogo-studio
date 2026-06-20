export type WorldMode = "day" | "night";

const DEFAULT_MODE: WorldMode = "night";

let mode: WorldMode = DEFAULT_MODE;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setWorldMode(next: WorldMode): void {
  if (mode === next) return;
  mode = next;
  emit();
}

export function subscribeWorldTheme(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getWorldModeSnapshot(): WorldMode {
  return mode;
}

export function getWorldModeServerSnapshot(): WorldMode {
  return DEFAULT_MODE;
}

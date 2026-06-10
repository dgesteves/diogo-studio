export type PerfSnapshot = {
  active: boolean;
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  updatedAt: number;
};

const INITIAL: PerfSnapshot = {
  active: false,
  fps: 0,
  frameMs: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  updatedAt: 0,
};

let snapshot: PerfSnapshot = INITIAL;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function publishPerf(next: Partial<PerfSnapshot>): void {
  snapshot = { ...snapshot, ...next, active: true, updatedAt: Date.now() };
  emit();
}

export function markPerfInactive(): void {
  if (!snapshot.active) return;
  snapshot = { ...snapshot, active: false };
  emit();
}

export function subscribePerf(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getPerfSnapshot(): PerfSnapshot {
  return snapshot;
}

export function getPerfServerSnapshot(): PerfSnapshot {
  return INITIAL;
}

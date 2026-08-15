import { createStore } from "@/store";

/**
 * Frame statistics, produced by the renderer and displayed by the inspector. The world owns
 * them because the world measures them, which is why this module is public to siblings while
 * the rest of `world/` is not — `docs/refactor.md` §4.2.
 */

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

const perf = createStore<PerfSnapshot>({
  active: false,
  fps: 0,
  frameMs: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  updatedAt: 0,
});

export function publishPerf(next: Partial<PerfSnapshot>): void {
  perf.update((prev) => ({ ...prev, ...next, active: true, updatedAt: Date.now() }));
}

export function markPerfInactive(): void {
  perf.update((prev) => (prev.active ? { ...prev, active: false } : prev));
}

export const subscribePerf = perf.subscribe;
export const getPerfSnapshot = perf.get;
export const getPerfServerSnapshot = perf.getServer;

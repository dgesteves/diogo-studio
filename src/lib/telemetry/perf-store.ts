/**
 * 3D render telemetry — a tiny module-level store bridging the R3F canvas and
 * the Inspector Overlay (S4).
 *
 * An in-Canvas reporter (`PerfReporter`) samples `WebGLRenderer.info` a few
 * times a second and publishes here; the overlay subscribes via
 * `useSyncExternalStore`. Keeping the bridge outside React means the canvas
 * never re-renders to report, and the overlay only re-renders when it's
 * actually mounted and listening.
 *
 * `r3f-perf` was dropped in Phase 2 (Turbopack can't parse its base64 bitmap
 * font); this store + the overlay are the Phase 5 replacement for the rich
 * perf surface it would have provided.
 */

export type PerfSnapshot = {
  /** True while a live WebGL renderer is reporting. */
  active: boolean;
  /** Frames per second over the last sampling window. */
  fps: number;
  /** Mean milliseconds per frame over the last window. */
  frameMs: number;
  /** Draw calls in the last rendered frame. */
  drawCalls: number;
  /** Triangles rendered in the last frame. */
  triangles: number;
  /** Live geometries held by the renderer. */
  geometries: number;
  /** Live textures held by the renderer. */
  textures: number;
  /** Compiled shader programs. */
  programs: number;
  /** `Date.now()` of the last publish. */
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

/** Reporter → store. Merges a partial sample and notifies subscribers. */
export function publishPerf(next: Partial<PerfSnapshot>): void {
  snapshot = { ...snapshot, ...next, active: true, updatedAt: Date.now() };
  emit();
}

/** Called when the canvas unmounts (reduced-motion, off-screen, navigation). */
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

/** Stable reference for SSR — `useSyncExternalStore` requires identity stability. */
export function getPerfServerSnapshot(): PerfSnapshot {
  return INITIAL;
}

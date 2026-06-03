/**
 * Web Vitals telemetry store — a module-level bridge between the `web-vitals`
 * package and the Inspector Overlay (S4), mirroring `perf-store`.
 *
 * web-vitals callbacks can't be unregistered and must be registered exactly
 * once per page load. Doing that inside a React effect is fragile: under
 * `reactStrictMode` the effect double-invokes (mount → cleanup → mount), and a
 * naive ref-guard + cancellation flag races such that the metrics never
 * register at all. Hoisting registration to this module sidesteps that — we
 * register on the first subscribe and never again, regardless of how many
 * times the overlay opens and closes.
 *
 * The `web-vitals` chunk is still imported lazily (only on first subscribe),
 * so it stays off the initial bundle. web-vitals buffers performance entries,
 * so LCP/FCP/TTFB are reported even though we register after page load.
 */

import type { Metric } from "web-vitals";

export type VitalRating = "good" | "needs-improvement" | "poor";
export type VitalName = "LCP" | "INP" | "CLS" | "TTFB" | "FCP";
export type VitalSample = { value: number; rating: VitalRating };
export type VitalsSnapshot = Partial<Record<VitalName, VitalSample>>;

const EMPTY: VitalsSnapshot = {};
let snapshot: VitalsSnapshot = EMPTY;
const listeners = new Set<() => void>();
let started = false;

function emit(): void {
  for (const listener of listeners) listener();
}

function record(metric: Metric): void {
  snapshot = {
    ...snapshot,
    [metric.name]: { value: metric.value, rating: metric.rating },
  };
  emit();
}

/** Lazily register every web-vital exactly once, on first subscribe. */
function ensureStarted(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  void import("web-vitals").then(({ onLCP, onINP, onCLS, onTTFB, onFCP }) => {
    onLCP(record);
    onINP(record, { reportAllChanges: true });
    onCLS(record, { reportAllChanges: true });
    onTTFB(record);
    onFCP(record);
  });
}

export function subscribeVitals(callback: () => void): () => void {
  ensureStarted();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getVitalsSnapshot(): VitalsSnapshot {
  return snapshot;
}

/** Stable reference for SSR — `useSyncExternalStore` requires identity stability. */
export function getVitalsServerSnapshot(): VitalsSnapshot {
  return EMPTY;
}

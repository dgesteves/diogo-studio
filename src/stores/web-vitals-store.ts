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

export function getVitalsServerSnapshot(): VitalsSnapshot {
  return EMPTY;
}

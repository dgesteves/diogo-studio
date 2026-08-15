import type { Metric } from "web-vitals";
import { createStore } from "@/store";

export const DEFAULT_TRACES_SAMPLE_RATE = 0.1;

export type VitalRating = "good" | "needs-improvement" | "poor";
export type VitalName = "LCP" | "INP" | "CLS" | "TTFB" | "FCP";
export type VitalSample = { value: number; rating: VitalRating };
export type VitalsSnapshot = Partial<Record<VitalName, VitalSample>>;

const vitals = createStore<VitalsSnapshot>({});
let started = false;

function record(metric: Metric): void {
  vitals.update((prev) => ({
    ...prev,
    [metric.name]: { value: metric.value, rating: metric.rating },
  }));
}

/**
 * Collection starts on the first subscriber and never again, so the overlay costs nothing
 * until it is opened and a second panel cannot double-count a metric. The import is dynamic
 * because `web-vitals` is only worth downloading once something is listening.
 */
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
  return vitals.subscribe(callback);
}

export const getVitalsSnapshot = vitals.get;
export const getVitalsServerSnapshot = vitals.getServer;

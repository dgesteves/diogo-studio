import type { VitalRating } from "@/lib/telemetry/web-vitals-store";

export const ratingTone: Record<VitalRating, string> = {
  good: "text-signal-good",
  "needs-improvement": "text-signal-warn",
  poor: "text-signal-hot",
};

export function formatVital(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${Math.round(value)}ms`;
}

export function fpsTone(fps: number): string {
  if (fps >= 55) return "text-signal-good";
  if (fps >= 30) return "text-signal-warn";
  return "text-signal-hot";
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

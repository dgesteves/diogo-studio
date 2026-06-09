export type LogTone = "ok" | "info" | "warn";
export type LogLine = { tone: LogTone; text: string };

export const LOG_POOL: LogLine[] = [
  { tone: "ok", text: "✓ deploy  origin/main → live  2.4s" },
  { tone: "info", text: "▸ build  pnpm test  18/18  ok" },
  { tone: "ok", text: "✓ axe-core  0 violations · 12 routes" },
  { tone: "info", text: "▸ web-vitals  LCP 0.9s  INP 124ms" },
  { tone: "ok", text: "✓ size-limit  93kb < 110kb  ok" },
  { tone: "info", text: "▸ /work prefetch  hot path warmed" },
  { tone: "ok", text: "✓ shader compile  3 frags  ok" },
  { tone: "warn", text: "⚠ flaky retry  → passed (1/3)" },
  { tone: "ok", text: "✓ ts-strict  0 errors · 218 modules" },
  { tone: "info", text: "▸ image pipeline  AVIF · WebP · 2x" },
  { tone: "ok", text: "✓ a11y axe  contrast AA  patterns" },
  { tone: "info", text: "▸ rsc cache  hit/miss  21 / 4" },
];

/**
 * Called only from the overlay's effect, so `window` and Resource Timing are both present —
 * the guards that used to stand in for that could not run. Entry names are absolute URLs by
 * spec, which is what makes a prefix comparison a same-origin test.
 */
export function measureRouteJs(): { kb: number; count: number } {
  const { origin } = window.location;
  const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  let bytes = 0;
  let count = 0;
  for (const entry of entries) {
    const isScript = entry.initiatorType === "script" || entry.name.endsWith(".js");
    if (isScript && entry.name.startsWith(origin)) {
      bytes += entry.encodedBodySize || 0;
      count += 1;
    }
  }
  return { kb: Math.round(bytes / 1024), count };
}

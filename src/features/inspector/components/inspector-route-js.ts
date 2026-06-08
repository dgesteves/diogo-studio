export function measureRouteJs(): { kb: number; count: number } {
  if (typeof performance === "undefined" || !performance.getEntriesByType) {
    return { kb: 0, count: 0 };
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  let bytes = 0;
  let count = 0;
  for (const entry of entries) {
    const isScript = entry.initiatorType === "script" || entry.name.endsWith(".js");
    const sameOrigin = entry.name.startsWith(origin) || entry.name.startsWith("/");
    if (isScript && sameOrigin) {
      bytes += entry.encodedBodySize || 0;
      count += 1;
    }
  }
  return { kb: Math.round(bytes / 1024), count };
}

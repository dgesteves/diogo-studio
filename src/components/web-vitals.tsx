"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Reports Core Web Vitals (CLS, LCP, INP, FCP, TTFB) for the current page.
 *
 * Wire this up to your analytics provider (PostHog, Vercel Analytics, GA, etc.)
 * by replacing the body of the callback below.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") return;

    // Example: send to your /api/vitals endpoint via Beacon API.
    //
    // const body = JSON.stringify(metric);
    // const url = "/api/vitals";
    // if (navigator.sendBeacon) {
    //   navigator.sendBeacon(url, body);
    // } else {
    //   fetch(url, { body, method: "POST", keepalive: true });
    // }

    // For now, just log so you can see them in browser devtools:
    console.log("[web-vitals]", metric);
  });

  return null;
}

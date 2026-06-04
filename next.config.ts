import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

import "./src/env";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const isDev = process.env.NODE_ENV !== "production";

// `'unsafe-eval'` + `ws:` are dev-only (React Refresh + HMR socket).
// `upgrade-insecure-requests` is gated on Vercel (real https) so it can't break
// http://localhost prod testing (e.g. `pnpm start` in CI e2e).
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(process.env.VERCEL === "1" ? ["upgrade-insecure-requests"] : []),
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  poweredByHeader: false,
  // Allow HMR through the IDE's browser-preview proxy (127.0.0.1) and the LAN
  // IP next prints on `pnpm dev`. Has no effect on production.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

const wrappedConfig = withBundleAnalyzer(nextConfig);

const sentryEnabled = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export default sentryEnabled
  ? withSentryConfig(wrappedConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
      webpack: {
        reactComponentAnnotation: { enabled: true },
        treeshake: { removeDebugLogging: true },
        automaticVercelMonitors: true,
      },
      // Source maps are uploaded only when SENTRY_AUTH_TOKEN is present.
      // We deliberately keep the `//# sourceMappingURL=` references in the
      // shipped JS (and the maps on disk) so Lighthouse's
      // `valid-source-maps` audit passes and debugging is easy in browser
      // devtools. For a portfolio, exposing maps is a net positive
      // (transparency); for a security-sensitive app this should flip.
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
        deleteSourcemapsAfterUpload: false,
      },
    })
  : wrappedConfig;

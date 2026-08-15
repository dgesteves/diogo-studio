import type { Metadata, Viewport } from "next";
import { env } from "@/env";
import type { PageSlug } from "@/content/pages";
import { siteConfig } from "@/content/profile";
import { getPage } from "@/content/prose";

/**
 * Everything the document says about itself: the origin it resolves against, the metadata
 * every route inherits, and each page's own. All three derive from one place — `env` for the
 * origin, `content/` for every word — and none of them restates a fact.
 */

const DEFAULT_SITE_URL = "http://localhost:3000";

function normalizeUrl(value: string): string {
  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

/**
 * The deployment's own origin, in precedence order: an explicit app URL, then Vercel's
 * production domain, then the per-deployment URL, then localhost. Anything that builds an
 * absolute URL — `metadataBase`, the sitemap, robots, JSON-LD — goes through this rather
 * than reading env itself.
 */
export function getSiteUrl(): string {
  const candidate = env.NEXT_PUBLIC_APP_URL ?? env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL;

  return candidate ? normalizeUrl(candidate) : DEFAULT_SITE_URL;
}

const siteUrl = getSiteUrl();
const siteName = siteConfig.name;
const siteTitle = `${siteConfig.name} — ${siteConfig.role}`;

const ogImage = {
  url: "/images/world-poster.png",
  width: 5116,
  height: 2084,
  alt: siteTitle,
} as const;

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s · ${siteName}`,
  },
  description: siteConfig.tagline,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  keywords: [
    "Staff Engineer",
    "Principal Engineer",
    "Frontend Platform",
    "AI-native",
    "design systems",
    "Next.js",
    "React",
    "TypeScript",
    "agentic UX",
    siteName,
  ],
  alternates: {
    canonical: "/",
  },
  // Deliberately without `title`, `description` or `url`. An explicit value here is
  // inherited verbatim by every child route rather than being overridden by that
  // route's own `title` / `description`, so pinning them made all 17 pages share the
  // home page's social preview and point `og:url` at `/`. Omitted, Next derives
  // `og:title` and `og:description` per page from the resolved metadata, and Twitter's
  // in turn from Open Graph. Asserted in `tests/e2e/seo.spec.ts`.
  openGraph: {
    type: "website",
    siteName,
    locale: "en_US",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.twitterHandle,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const rootViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * A page's metadata, derived rather than restated. Every station used to hand-copy its
 * `summary` into `description`, and three had already drifted from the record by the time
 * this replaced them.
 *
 * `title` is the page's short label, which the root's `%s · Diogo Esteves` template
 * completes; `description` is the summary, which is also the Open Graph and agent-facing
 * description — one sentence, one owner. Open Graph is deliberately not set here: Next
 * derives it from the resolved metadata, and a value at any level is inherited verbatim by
 * every child. See `.claude/rules/nextjs-app-router.md`.
 *
 * The home page is the one route that does not call this. The root's default title and
 * description are the site's own and its canonical is already `/`, so deriving there would
 * retitle the most-shared surface after a station.
 */
export function pageMetadata(slug: PageSlug): Metadata {
  const page = getPage(slug);

  return {
    title: page.label,
    description: page.summary,
    alternates: { canonical: page.href },
  };
}

import type { Metadata, Viewport } from "next";
import { getSiteUrl } from "@/config/site-url";
import { siteConfig } from "@/content/profile";

const siteUrl = getSiteUrl();
const siteName = siteConfig.name;
const siteTitle = `${siteConfig.name} — ${siteConfig.role}`;
const siteDescription = siteConfig.tagline;

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
  description: siteDescription,
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

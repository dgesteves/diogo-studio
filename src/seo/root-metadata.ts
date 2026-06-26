import type { Metadata, Viewport } from "next";
import { getSiteUrl, siteConfig } from "@/config/site";

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
  openGraph: {
    type: "website",
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: "/",
    locale: "en_US",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
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

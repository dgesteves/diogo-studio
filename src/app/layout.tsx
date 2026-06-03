import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProviders } from "@/components/providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { CommandMenu } from "@/features/command-menu";
import { InspectorOverlay } from "@/features/inspector";
import { env } from "@/env";
import { siteConfig } from "@/config/site";
import { personJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";
import "@/styles/globals.css";
import "@/styles/mdx.css";

// Vercel Analytics + Speed Insights only resolve their script payloads on
// Vercel-hosted deployments (`/_vercel/insights/script.js`). Outside Vercel
// they 404, polluting the console and dragging the Lighthouse "Best
// practices" score for no functional benefit.
const isVercel = process.env.VERCEL === "1";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const siteName = siteConfig.name;
const siteTitle = `${siteConfig.name} — ${siteConfig.role}`;
const siteDescription = siteConfig.tagline;

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    creator: siteConfig.twitterHandle,
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Next 16 honors `data-scroll-behavior="smooth"` to preserve our CSS
      // `scroll-behavior: smooth` during App-Router transitions.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <JsonLd data={personJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <AppProviders>
          <SiteNav />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <SiteFooter />
          <CommandMenu />
          <InspectorOverlay />
        </AppProviders>
        {isVercel ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}

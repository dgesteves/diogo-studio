import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProviders } from "@/components/providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { CommandMenu, CommandMenuProvider } from "@/features/command-menu";
import { EasterEgg } from "@/features/easter-egg";
import { InspectorOverlay, InspectorOverlayProvider } from "@/features/inspector";
import { env } from "@/env";
import { getSiteUrl, siteConfig } from "@/config/site";
import { personJsonLd, websiteJsonLd } from "@/lib/seo/structured-data";
import { cn } from "@/lib/utils/cn";
import "@/styles/globals.css";
import "@/styles/mdx.css";

const isVercel = env.VERCEL === "1";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();
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
}>): React.ReactElement {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn(geistSans.variable, geistMono.variable, "antialiased")}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-dvh flex-col">
        <JsonLd data={personJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <AppProviders>
          <InspectorOverlayProvider>
            <CommandMenuProvider>
              <SiteNav />
              <main id="main" className="flex flex-1 flex-col">
                {children}
              </main>
              <SiteFooter />
              <CommandMenu />
              <InspectorOverlay />
              <EasterEgg />
            </CommandMenuProvider>
          </InspectorOverlayProvider>
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

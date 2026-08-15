import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProviders } from "./providers";
import { CommandMenu } from "@/command-menu/menu";
import { CommandMenuProvider } from "@/command-menu/store";
import { InspectorOverlay } from "@/telemetry/overlay";
import { InspectorOverlayProvider } from "@/telemetry/store";
import { env } from "@/env";
import { JsonLd, personJsonLd, websiteJsonLd } from "@/site/structured-data";
import { cn } from "@/ui/cn";
import "@/globals.css";

export { rootMetadata as metadata, rootViewport as viewport } from "@/site/metadata";

const isVercel = env.VERCEL === "1";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
              <main id="main" className="flex flex-1 flex-col">
                {children}
              </main>
              <CommandMenu />
              <InspectorOverlay />
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

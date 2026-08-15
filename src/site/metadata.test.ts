import { afterEach, describe, expect, it, vi } from "vitest";
import { setTestEnv } from "@tests/env";
import { siteConfig } from "@/content/profile";
import { getSiteUrl, rootMetadata, rootViewport } from "./metadata";

vi.mock("@/config/env", async () => ({ env: (await import("@tests/env")).testEnv }));

/**
 * The site-wide metadata every route inherits from, and the origin it resolves against.
 * Inheritance itself is invisible here — it does not exist until a route renders, and
 * `tests/e2e/seo.spec.ts` asserts it per route over HTTP. What this file guards is the shape
 * of the source: the three Open Graph fields that must stay absent, the ones that must stay
 * present, and the precedence that decides which host every absolute URL is built on.
 *
 * `pageMetadata` is not here: it is asserted where its output is visible, in
 * `tests/e2e/seo.spec.ts` and `src/app/pages.test.tsx`.
 */

const DEPLOY_URL = "diogo-studio-git-main.vercel.app";
const PRODUCTION_URL = "diogo.studio";

afterEach(() => {
  setTestEnv();
});

describe("rootMetadata", () => {
  /**
   * The regression that matters. An explicit `openGraph.title`, `description` or `url` here is
   * inherited **verbatim** by every child route rather than being overridden by that route's own
   * values, so pinning them shipped the home page's social preview on all 17 pages and pointed
   * every `og:url` at `/`. Left absent, Next derives them per page. Adding them back looks like
   * being explicit and is the bug — see `docs/decisions.md`.
   */
  it("leaves og:title, og:description and og:url for Next to derive per page", () => {
    expect(rootMetadata.openGraph).not.toHaveProperty("title");
    expect(rootMetadata.openGraph).not.toHaveProperty("description");
    expect(rootMetadata.openGraph).not.toHaveProperty("url");
  });

  it("keeps the fields that are the same on every page", () => {
    // These are the ones inheritance is *for*: identity, language and the card image.
    expect(rootMetadata.openGraph).toMatchObject({
      type: "website",
      siteName: siteConfig.name,
      locale: "en_US",
    });
    expect(rootMetadata.openGraph?.images).toHaveLength(1);
  });

  it("titles a station as its own name beside the site's", () => {
    const title = rootMetadata.title as { default: string; template: string };

    expect(title.default).toContain(siteConfig.name);
    expect(title.default).toContain(siteConfig.role);
    // The template is what turns a page's bare `title: "Work"` into a full document title.
    expect(title.template).toBe(`%s · ${siteConfig.name}`);
    expect(title.template).toContain("%s");
  });

  it("resolves relative URLs against the deployment's own origin", () => {
    // Without `metadataBase`, a relative card image resolves against localhost in production.
    expect(String(rootMetadata.metadataBase)).toBe(new URL(getSiteUrl()).toString());
    expect(rootMetadata.alternates?.canonical).toBe("/");
  });

  it("offers the card image to Twitter as a large summary", () => {
    expect(rootMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      creator: siteConfig.twitterHandle,
    });
    // The same image object as Open Graph, so the two cannot drift apart.
    expect(rootMetadata.twitter?.images).toEqual(rootMetadata.openGraph?.images);
  });

  it("asks to be indexed, with large previews", () => {
    expect(rootMetadata.robots).toMatchObject({ index: true, follow: true });
    expect(rootMetadata.robots).toHaveProperty(["googleBot", "max-image-preview"], "large");
  });
});

describe("rootViewport", () => {
  /** A theme color that ignores the scheme paints a light browser chrome around a dark page. */
  it("gives the browser chrome a color for each color scheme", () => {
    const themeColor = rootViewport.themeColor as { media: string; color: string }[];

    expect(themeColor.map((entry) => entry.media)).toEqual([
      "(prefers-color-scheme: light)",
      "(prefers-color-scheme: dark)",
    ]);
    expect(new Set(themeColor.map((entry) => entry.color)).size).toBe(2);
  });

  it("lets the page scale, because preventing zoom fails WCAG 1.4.4", () => {
    expect(rootViewport.width).toBe("device-width");
    expect(rootViewport.initialScale).toBe(1);
    expect(rootViewport).not.toHaveProperty("maximumScale");
    expect(rootViewport).not.toHaveProperty("userScalable");
  });
});

describe("getSiteUrl() precedence", () => {
  it("prefers the explicit app url over anything Vercel injects", () => {
    setTestEnv({
      NEXT_PUBLIC_APP_URL: "https://diogo.studio",
      VERCEL_PROJECT_PRODUCTION_URL: PRODUCTION_URL,
      VERCEL_URL: DEPLOY_URL,
    });

    expect(getSiteUrl()).toBe("https://diogo.studio");
  });

  it("prefers the production domain over the per-deployment url", () => {
    setTestEnv({ VERCEL_PROJECT_PRODUCTION_URL: PRODUCTION_URL, VERCEL_URL: DEPLOY_URL });

    expect(getSiteUrl()).toBe(`https://${PRODUCTION_URL}`);
  });

  it("falls back to the per-deployment url on a preview build", () => {
    setTestEnv({ VERCEL_URL: DEPLOY_URL });

    expect(getSiteUrl()).toBe(`https://${DEPLOY_URL}`);
  });

  it("falls back to localhost when nothing is configured", () => {
    setTestEnv();

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});

describe("getSiteUrl() normalization", () => {
  it("adds https to a bare host, since Vercel supplies no protocol", () => {
    setTestEnv({ VERCEL_URL: DEPLOY_URL });

    expect(getSiteUrl()).toBe(`https://${DEPLOY_URL}`);
  });

  it("keeps an explicit protocol, including http for local work", () => {
    setTestEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:4000" });

    expect(getSiteUrl()).toBe("http://localhost:4000");
  });

  it("strips trailing slashes, so callers can concatenate a route safely", () => {
    setTestEnv({ NEXT_PUBLIC_APP_URL: "https://diogo.studio///" });

    expect(getSiteUrl()).toBe("https://diogo.studio");
  });

  it("never ends in a slash, whatever it was given", () => {
    for (const value of ["https://diogo.studio/", `${PRODUCTION_URL}/`, "https://a.b/c/"]) {
      setTestEnv({ NEXT_PUBLIC_APP_URL: value });
      expect(getSiteUrl().endsWith("/")).toBe(false);
    }
  });
});

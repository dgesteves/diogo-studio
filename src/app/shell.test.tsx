import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetTestEnv, setTestEnv } from "@tests/env";

/**
 * The two layouts, rendered as the shell a visitor actually gets: the root's document wrapping
 * the `(world)` group's chrome wrapping a page. Neither is asserted anywhere else, and between
 * them they own the page language, the skip-link target, the structured data and whether the
 * world's chrome exists at all.
 *
 * `next/font/google` is stubbed because it is a build-time transform — the loader is not a
 * function outside a Next build. That is the dependency, not the layout: everything else here
 * is the real tree, server-rendered exactly as the first response is.
 */

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

vi.mock("@/env", async () => ({ env: (await import("@tests/env")).testEnv }));

/**
 * Both inject their script on mount, so neither leaves a trace in server-rendered markup. The
 * decision under test is ours — whether they are rendered at all — so they are replaced with
 * markers at the library boundary.
 */
vi.mock("@vercel/analytics/next", () => ({ Analytics: () => "[analytics]" }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: () => "[speed-insights]" }));

const PAGE = "the page itself";

async function shell(): Promise<string> {
  const [{ default: RootLayout }, { default: WorldLayout }] = await Promise.all([
    import("./layout"),
    import("./(world)/layout"),
  ]);

  return renderToStaticMarkup(RootLayout({ children: WorldLayout({ children: PAGE }) }));
}

afterEach(() => {
  vi.resetModules();
  resetTestEnv();
});

describe("the app shell", () => {
  it("renders the page inside the document", async () => {
    const html = await shell();

    expect(html).toContain("<html");
    expect(html).toContain(PAGE);
  });

  /** WCAG 3.1.1: without a language, a screen reader guesses the pronunciation of every word. */
  it("declares the page language", async () => {
    expect(await shell()).toContain('lang="en"');
  });

  /**
   * The skip link points at `#main`, so this id is what makes "skip to content" work. It is also
   * the landmark that lets assistive technology jump past the world's chrome.
   */
  it("wraps the page in the main landmark the skip link targets", async () => {
    const html = await shell();

    expect(html).toMatch(/<main[^>]*id="main"/);
    expect(html.indexOf('id="main"')).toBeLessThan(html.indexOf(PAGE));
  });

  it("publishes both structured-data graphs", async () => {
    const html = await shell();

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"Person"');
    expect(html).toContain('"WebSite"');
  });

  it("mounts the world's chrome around the page", async () => {
    const html = await shell();

    // The boot splash covers the gap before hydration, so it has to be in the first response.
    expect(html).toContain("boot-splash");
  });

  /**
   * Vercel's analytics and speed-insights scripts are gated on running *on* Vercel. Off it — a
   * local build, a self-host, a preview of a fork — they would load two third-party scripts that
   * can never report anywhere. The flag is read at module scope, so each case needs a fresh
   * import of the layout.
   */
  it("loads Vercel's analytics only when deployed on Vercel", async () => {
    setTestEnv({ VERCEL: "1" });
    const onVercel = await shell();
    expect(onVercel).toContain("[analytics]");
    expect(onVercel).toContain("[speed-insights]");

    vi.resetModules();
    setTestEnv({ VERCEL: undefined });
    const elsewhere = await shell();

    expect(elsewhere).not.toContain("[analytics]");
    expect(elsewhere).not.toContain("[speed-insights]");
  });
});

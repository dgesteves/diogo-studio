import { siteConfig } from "@/config/site";
import { routes, type RoutePath } from "@/constants/routes";
import { expect, test } from "./fixtures";

/**
 * Every route, asserted end to end — the one thing only a browser can tell us about a
 * page: that it is actually served, actually renders, and does not throw on the way.
 * Three of the seventeen were spot-checked before this existed; the other fourteen
 * could have 500ed without a single test noticing.
 *
 * The list is derived from `routes.ts` rather than written out, so a new route is
 * covered the moment it is declared. That is the same source `sitemap.ts` uses, and
 * `metadata-routes.test.ts` already pins the two together — so the chain here is
 * "declared → listed in the sitemap → serves a page", with each link asserted once at
 * the cheapest layer that can see it.
 */
const ROUTE_PATHS: readonly RoutePath[] = Object.values(routes);

const TITLE_SUFFIX = ` · ${siteConfig.name}`;

test.describe("Every route", () => {
  for (const path of ROUTE_PATHS) {
    test(`${path} renders one heading, its own title, and its canonical`, async ({ page }) => {
      // Attached before `goto`, so a module-evaluation throw during hydration is caught
      // rather than missed. `pageerror` is the one that matters: an uncaught exception
      // in a client island leaves the page looking fine while nothing works.
      //
      // Scope, deliberately: every assertion here settles on server-rendered markup, so
      // the sweep does not wait for the canvas and will not see a throw from deeper in
      // the scene's setup. Waiting for it on all seventeen would cost minutes to
      // re-check one route-independent scene; `world-3d.spec.ts` owns that instead.
      const problems: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") problems.push(`console: ${message.text()}`);
      });
      page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      // Exactly one — `destination-panel.tsx` and `hero-section.tsx` are the only two
      // sources of an `h1` in the app, and a page must reach precisely one of them.
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toHaveCount(1);
      await expect(heading).toBeVisible();
      await expect(heading).not.toBeEmpty();

      await expect(page).toHaveTitle(new RegExp(siteConfig.name));

      // Compared by path, not by URL: `metadataBase` follows `NEXT_PUBLIC_APP_URL`, so
      // the origin differs between a local run, `e2e:runner` (no `.env.local`) and
      // production. The path is the part the page is responsible for.
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, `${path} declares a canonical link`).not.toBeNull();
      expect(new URL(canonical ?? "", "http://canonical.invalid").pathname).toBe(path);

      expect(problems).toEqual([]);
    });
  }

  /**
   * The failure this catches is a page losing its `metadata` export — Next then falls
   * back to the root title and description, silently, and two routes start competing
   * for the same search result. Uniqueness is what makes that visible without pinning
   * seventeen strings here: the home page legitimately carries the root copy, so any
   * other page that falls back collides with it.
   *
   * Driven over HTTP rather than through the browser — these are `<head>` contents, so
   * seventeen more page loads would buy nothing.
   */
  test("every route ships its own title and description", async ({ request }) => {
    const titles = new Map<string, RoutePath>();
    const descriptions = new Map<string, RoutePath>();

    for (const path of ROUTE_PATHS) {
      const response = await request.get(path);
      expect(response.status(), `${path} is served`).toBe(200);
      const html = await response.text();

      const title = firstGroup(html, /<title>([^<]*)<\/title>/);
      const description = firstGroup(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/);

      expect(title, `${path} has a non-empty title`).toBeTruthy();
      expect(description, `${path} has a non-empty description`).toBeTruthy();

      expect(titles.get(title ?? ""), `${path} and its match share a title`).toBeUndefined();
      expect(
        descriptions.get(description ?? ""),
        `${path} and its match share a description`,
      ).toBeUndefined();

      titles.set(title ?? "", path);
      descriptions.set(description ?? "", path);

      // `rootMetadata` sets `template: "%s · <name>"`, so every page that declares its
      // own title is wrapped by it. Home uses the `default` instead and is exempt.
      if (path !== routes.home) expect(title).toContain(TITLE_SUFFIX);
    }

    expect(titles.size).toBe(ROUTE_PATHS.length);
    expect(descriptions.size).toBe(ROUTE_PATHS.length);
  });
});

function firstGroup(html: string, pattern: RegExp): string | null {
  return pattern.exec(html)?.[1] ?? null;
}

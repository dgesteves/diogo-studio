import { siteConfig } from "@/config/site";
import { routes, type RoutePath } from "@/constants/routes";
import { expect, readMeta, readTitle, test } from "./fixtures";

/**
 * The metadata a page only really has once Next has resolved it — which is why this is
 * asserted over HTTP and not against `rootMetadata` as an object. Inheritance is the
 * whole subject here, and inheritance does not exist until a route is rendered.
 *
 * Not hypothetical: until `root-metadata.ts` stopped pinning `openGraph.title` /
 * `description` / `url`, every route inherited them verbatim, so every link shared
 * anywhere previewed as the home page and `og:url` pointed at `/`.
 *
 * The rest of the file covers what only a real request can show: that the crawler
 * endpoints and the generated icons are served, as what they claim to be.
 * `metadata-routes.test.ts` and `structured-data.test.ts` already pin the payloads in
 * milliseconds, so nothing here re-checks a field either of them owns.
 */
const ROUTE_PATHS: readonly RoutePath[] = Object.values(routes);

const SITEMAP = "/sitemap.xml";

test.describe("Social metadata", () => {
  test("every route previews as itself, not as the home page", async ({ request }) => {
    const ogTitles = new Set<string>();

    for (const path of ROUTE_PATHS) {
      const html = await (await request.get(path)).text();

      // Next derives Open Graph from the resolved metadata, and Twitter from Open
      // Graph, so equality here is the whole contract: get `<title>` and `description`
      // right and the social tags follow. Pinning them at the root is what broke it.
      expect(readMeta(html, "og:title"), `${path} og:title`).toBe(readTitle(html));
      expect(readMeta(html, "og:description"), `${path} og:description`).toBe(
        readMeta(html, "description"),
      );
      expect(readMeta(html, "twitter:title"), `${path} twitter:title`).toBe(readTitle(html));
      expect(readMeta(html, "twitter:description"), `${path} twitter:description`).toBe(
        readMeta(html, "description"),
      );

      ogTitles.add(readMeta(html, "og:title") ?? "");
    }

    expect(ogTitles.size).toBe(ROUTE_PATHS.length);
  });

  test("the shared card image is absolute and actually exists", async ({ request }) => {
    const html = await (await request.get(routes.home)).text();

    const ogImage = readMeta(html, "og:image");
    expect(ogImage).toBe(readMeta(html, "twitter:image"));
    expect(ogImage, "og:image is absolute — crawlers do not resolve relative URLs").toMatch(
      /^https?:\/\//,
    );

    // Fetched by path so the origin can differ between a local run, `e2e:runner` and
    // production. A card that 404s is invisible until someone shares a link.
    const asset = await request.get(new URL(ogImage ?? "").pathname);
    expect(asset.status()).toBe(200);
    expect(asset.headers()["content-type"]).toContain("image");

    expect(readMeta(html, "og:type")).toBe("website");
    expect(readMeta(html, "og:locale")).toBe("en_US");
    expect(readMeta(html, "og:site_name")).toBe(siteConfig.name);
    expect(readMeta(html, "twitter:card")).toBe("summary_large_image");
    expect(readMeta(html, "twitter:creator")).toBe(siteConfig.twitterHandle);
  });
});

test.describe("Structured data", () => {
  test("ships a Person and a WebSite that reference each other", async ({ page }) => {
    await page.goto(routes.home);

    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(2);

    const graph = await scripts.allTextContents();
    const parsed = graph.map((json) => JSON.parse(json) as Record<string, unknown>);

    const person = parsed.find((node) => node["@type"] === "Person");
    const website = parsed.find((node) => node["@type"] === "WebSite");
    expect(person, "a Person node is present").toBeDefined();
    expect(website, "a WebSite node is present").toBeDefined();

    expect(person?.name).toBe(siteConfig.name);
    expect(person?.jobTitle).toBe(siteConfig.role);
    expect(person?.sameAs).toEqual([siteConfig.links.github, siteConfig.links.linkedin]);

    // The `@id` cross-reference is the part that makes it a graph rather than two
    // unrelated blobs, and the part a search engine needs to attribute the site to the
    // person. `structured-data.test.ts` owns the field-by-field shape.
    expect(website?.author).toEqual({ "@id": person?.["@id"] });
    expect(website?.publisher).toEqual({ "@id": person?.["@id"] });
  });
});

test.describe("Crawler endpoints", () => {
  test("sitemap.xml is served as XML and lists every route once", async ({ request }) => {
    const response = await request.get(SITEMAP);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");

    const xml = await response.text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => new URL(match[1] ?? "").pathname,
    );

    // Completeness only — `metadata-routes.test.ts` owns the priority and cadence split,
    // so re-checking it here would buy a slower copy of an existing assertion.
    expect([...paths].sort()).toEqual([...ROUTE_PATHS].sort());
  });

  test("robots.txt is served as text and points at an absolute sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");

    const body = await response.text();
    expect(body).toContain("Disallow: /api/");
    expect(body).toMatch(new RegExp(`Sitemap: https?://[^\\s]+${SITEMAP}`));
  });

  test("the generated icons are served", async ({ page, request }) => {
    await page.goto(routes.home);

    // `icon.tsx` and `apple-icon.tsx` build their PNGs through satori at request time,
    // which has no observable behavior to unit test — so §5.3 of the testing plan
    // excludes them from coverage and buys this HTTP assertion instead. The hrefs carry
    // a content hash, so they are read from the page rather than guessed.
    for (const rel of ["icon", "apple-touch-icon"]) {
      const href = await page.locator(`link[rel="${rel}"]`).first().getAttribute("href");
      expect(href, `a ${rel} link is declared`).not.toBeNull();

      const response = await request.get(href ?? "");
      expect(response.status(), `${rel} is served`).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
    }
  });
});

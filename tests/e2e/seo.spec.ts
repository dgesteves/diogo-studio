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
 */
const ROUTE_PATHS: readonly RoutePath[] = Object.values(routes);

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

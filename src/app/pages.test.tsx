import { describe, expect, it } from "vitest";
import type { Metadata } from "next";
import { renderToStaticMarkup } from "react-dom/server";
import { routes, type RouteKey } from "@/content/pages";
import { CommandMenuProvider } from "@/features/command-menu";
import { getDestination } from "@/content/prose";

/**
 * All 17 route pages, discovered rather than listed, so a new one is asserted the moment the
 * file exists instead of when someone remembers to add it here.
 *
 * Each station page is a `metadata` object and one line delegating to `DestinationView`, which
 * makes the copy-paste error the realistic one: the right prose under the wrong canonical, or
 * two pages claiming the same title. `seo.spec.ts` catches those over HTTP in a browser; these
 * catch them in milliseconds, which is the difference between finding it before the commit and
 * finding it in CI. Metadata *inheritance* is still E2E's — it does not exist until a route
 * renders, and nothing here can see it.
 */

type PageModule = { default: () => React.ReactElement; metadata?: Metadata };

/**
 * The glob cannot spell `(world)`: parentheses are pattern syntax, so every page under `app/` is
 * matched and the route-group segments are stripped below.
 */
const modules = import.meta.glob("./**/page.tsx", { eager: true }) as Record<string, PageModule>;

/** `./(world)/about/page.tsx` → `/about`, and `./(world)/page.tsx` → `/`. */
function routePathOf(file: string): string {
  const segments = file
    .replace(/^\.\//, "")
    .replace(/\/?page\.tsx$/, "")
    .split("/")
    .filter((segment) => segment.length > 0 && !/^\(.*\)$/.test(segment));
  return `/${segments.join("/")}`;
}

const KEYS = Object.keys(routes) as RouteKey[];
const BY_PATH = new Map<string, RouteKey>(KEYS.map((key) => [routes[key], key]));

const pages = Object.entries(modules).map(([file, page]) => {
  const path = routePathOf(file);
  const slug = BY_PATH.get(path);
  if (!slug) throw new Error(`${file} serves ${path}, which is not in content/pages.ts`);
  return [slug, page] as const;
});

/**
 * Home renders its record like the other sixteen; the one thing it does not carry is its own
 * `metadata`, so it is only the metadata assertions that exclude it.
 */
const stations = pages.filter(([slug]) => slug !== "home");

function homePage(): PageModule {
  const found = pages.find(([slug]) => slug === "home");
  if (!found) throw new Error("There is no page serving /");
  return found[1];
}

/** React escapes text into entities, so an apostrophe in a title arrives as `&#x27;`. */
function decode(html: string): string {
  return html
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

describe("route pages", () => {
  it("gives every route in the URL single source of truth exactly one page", () => {
    expect(pages).toHaveLength(KEYS.length);
    expect(new Set(pages.map(([slug]) => slug)).size).toBe(KEYS.length);
  });

  /**
   * A canonical pointing at the wrong path is invisible on the page and tells search engines
   * two URLs are one. It is also the exact thing a copy-pasted page file gets wrong.
   */
  it("points each station's canonical at its own route", () => {
    for (const [slug, page] of stations) {
      expect(page.metadata?.alternates?.canonical, slug).toBe(routes[slug]);
    }
  });

  /**
   * Not "has a title and a description" but "has *its own* record's" — the assertion the copy
   * that used to sit in each of these files could never make, and the one that catches a page
   * wired to a neighbor's slug.
   */
  it("derives every station's title and description from its own record", () => {
    for (const [slug, page] of stations) {
      const record = getDestination(slug);

      expect(page.metadata?.title, slug).toBe(record.label);
      expect(page.metadata?.description, slug).toBe(record.summary);
    }
  });

  it("gives every station a distinct title and description", () => {
    const titles = stations.map(([, page]) => String(page.metadata?.title ?? ""));
    const descriptions = stations.map(([, page]) => String(page.metadata?.description ?? ""));

    // Duplicates are how a page silently serves the root's copy instead of its own.
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  /**
   * The home page carries **no** `metadata` of its own, deliberately: the root's default title
   * and description are the site's, and `alternates.canonical` there is already `/`. Adding a
   * `metadata` export here looks like an improvement and is the drift `decisions.md` records —
   * it duplicates the root's copy, which is what makes a lost export on another page invisible.
   */
  it("leaves the home page's metadata to the root", () => {
    expect(homePage().metadata).toBeUndefined();
  });

  /**
   * The one line each page has: the slug it hands `PageView`. Getting it wrong renders another
   * page's entire content under this URL, with correct metadata above it.
   *
   * All seventeen, home included — it stopped being a special case in Phase 2b, when it stopped
   * being a hidden hero. The provider is here because home's CTA reads the ⌘K store.
   */
  it("renders the page that belongs to its own route", () => {
    for (const [slug, page] of pages) {
      const html = decode(
        renderToStaticMarkup(<CommandMenuProvider>{page.default()}</CommandMenuProvider>),
      );

      expect(html, slug).toContain("<h1");
      expect(html, slug).toContain(getDestination(slug).title);
    }
  });
});

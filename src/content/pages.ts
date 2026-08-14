/**
 * Every page the site has, as identity and navigation only — slug, URL, short label,
 * and the editorial grouping. **No authored prose.**
 *
 * This is the client-safe half of the content record, and the split is load-bearing
 * rather than tidy: the full page carries `blocks`, so any client module that imports
 * the prose collection to read a slug or a label drags every page's text into the
 * browser bundle, where nothing reads it. Tree-shaking cannot help — these are property
 * reads on runtime objects, not module exports. Client islands (HUD, radar, portals,
 * active-station) import from here; only server modules import `./prose`.
 *
 * The URL map is derived from this list rather than declared beside it, so a route
 * exists in exactly one place.
 */

const PAGES = [
  { slug: "home", path: "/", label: "Studio" },
  { slug: "about", path: "/about", label: "About" },
  { slug: "work", path: "/work", label: "Work" },
  { slug: "projects", path: "/projects", label: "Projects" },
  { slug: "caseStudies", path: "/case-studies", label: "Case studies" },
  { slug: "writing", path: "/writing", label: "Writing" },
  { slug: "speaking", path: "/speaking", label: "Speaking" },
  { slug: "openSource", path: "/open-source", label: "Open source" },
  { slug: "playground", path: "/playground", label: "Playground" },
  { slug: "resume", path: "/resume", label: "Résumé" },
  { slug: "now", path: "/now", label: "Now" },
  { slug: "contact", path: "/contact", label: "Contact" },
  { slug: "principles", path: "/principles", label: "Principles" },
  { slug: "stack", path: "/stack", label: "Stack" },
  { slug: "uses", path: "/uses", label: "Uses" },
  { slug: "timeline", path: "/timeline", label: "Timeline" },
  { slug: "lab", path: "/lab", label: "Lab" },
] as const;

type PageEntry = (typeof PAGES)[number];

export type RouteKey = PageEntry["slug"];
export type RoutePath = PageEntry["path"];

/**
 * The URL map, keyed by slug. The assertion is what keeps each value a string literal
 * rather than the union of all of them, which is what `typedRoutes` needs to accept
 * `routes.work` as a real `Route`; `Object.fromEntries` cannot express that on its own.
 * It is the only cast in this file and everything below derives from `PAGES` directly.
 */
export const routes = Object.fromEntries(PAGES.map((page) => [page.slug, page.path])) as {
  readonly [P in PageEntry as P["slug"]]: P["path"];
};

export type InternalHref = RoutePath | `${RoutePath}#${string}`;

const ROUTE_PATHS: readonly string[] = Object.values(routes);

export function isRoutePath(value: string): value is RoutePath {
  return ROUTE_PATHS.includes(value);
}

export function asInternalHref(href: string): InternalHref | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex === 0) return null;
  const path = hashIndex === -1 ? href : href.slice(0, hashIndex);
  if (!isRoutePath(path)) return null;
  return hashIndex === -1 ? path : `${path}#${href.slice(hashIndex + 1)}`;
}

export type StationEntry = {
  slug: RouteKey;
  href: RoutePath;
  label: string;
};

export const STATION_ORDER: readonly RouteKey[] = PAGES.map((page) => page.slug);

const LABELS = Object.fromEntries(PAGES.map((page) => [page.slug, page.label])) as Record<
  RouteKey,
  string
>;

export function getStationEntry(slug: RouteKey): StationEntry {
  return { slug, href: routes[slug], label: LABELS[slug] };
}

export const stationIndex: readonly StationEntry[] = STATION_ORDER.map(getStationEntry);

/**
 * Editorial grouping, authored rather than derived: the order stations read in within a
 * sector is not the order they sit in the room, so it cannot come from `PAGES`.
 * `pages.test.ts` asserts every slug appears in exactly one sector.
 */
const SECTOR_SLUGS: readonly { label: string; slugs: readonly RouteKey[] }[] = [
  { label: "Core", slugs: ["home", "about"] },
  { label: "Experience", slugs: ["work"] },
  { label: "Projects", slugs: ["projects", "caseStudies"] },
  { label: "Craft", slugs: ["writing", "speaking", "openSource"] },
  { label: "Stance", slugs: ["now", "principles"] },
  { label: "Tooling", slugs: ["stack", "uses"] },
  { label: "Explorations", slugs: ["playground", "lab"] },
  { label: "Reach", slugs: ["contact", "resume"] },
  { label: "Timeline", slugs: ["timeline"] },
];

export type StationSector = {
  label: string;
  stations: readonly StationEntry[];
};

export const stationSectors: readonly StationSector[] = SECTOR_SLUGS.map((sector) => ({
  label: sector.label,
  stations: sector.slugs.map(getStationEntry),
}));

export function resolveStation(pathname: string | null): RouteKey {
  if (!pathname || pathname === "/") return "home";
  const match = stationIndex.find(
    (station) =>
      station.href !== "/" &&
      (pathname === station.href || pathname.startsWith(`${station.href}/`)),
  );
  return match?.slug ?? "home";
}

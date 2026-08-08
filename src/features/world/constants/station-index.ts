import { routes, type RouteKey, type RoutePath } from "@/constants/routes";

/**
 * The scalar projection of every destination: identity and navigation only, no
 * authored content.
 *
 * This exists for the client/server boundary, not for tidiness. `Destination`
 * carries `blocks` — the full prose body of a page — so any client module that
 * imports the destination collection to read a slug or a label drags every page's
 * text into the client bundle, where nothing reads it. Tree-shaking cannot help:
 * these are property reads on runtime objects, not module exports.
 *
 * So: client islands (HUD, radar, portals, active-station) import from here.
 * Only server components import `./destinations`, which joins this with content.
 */
export type StationEntry = {
  slug: RouteKey;
  href: RoutePath;
  label: string;
};

const LABELS: Record<RouteKey, string> = {
  home: "Studio",
  about: "About",
  work: "Work",
  projects: "Projects",
  caseStudies: "Case studies",
  writing: "Writing",
  speaking: "Speaking",
  openSource: "Open source",
  playground: "Playground",
  resume: "Résumé",
  now: "Now",
  contact: "Contact",
  principles: "Principles",
  stack: "Stack",
  uses: "Uses",
  timeline: "Timeline",
  lab: "Lab",
};

export const STATION_ORDER: readonly RouteKey[] = [
  "home",
  "about",
  "work",
  "projects",
  "caseStudies",
  "writing",
  "speaking",
  "openSource",
  "playground",
  "resume",
  "now",
  "contact",
  "principles",
  "stack",
  "uses",
  "timeline",
  "lab",
];

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

export function getStationEntry(slug: RouteKey): StationEntry {
  return { slug, href: routes[slug], label: LABELS[slug] };
}

export const stationIndex: readonly StationEntry[] = STATION_ORDER.map(getStationEntry);

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

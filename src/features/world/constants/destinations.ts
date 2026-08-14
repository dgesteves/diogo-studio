import type { RouteKey } from "@/content/pages";
import { STATION_ORDER } from "@/content/pages";
import type { Destination } from "../types";
import { coreDestinations } from "./destinations-core";
import { craftDestinations } from "./destinations-craft";
import { experienceDestinations } from "./destinations-experience";
import { explorationDestinations } from "./destinations-explorations";
import { openSourceDestinations } from "./destinations-open-source";
import { projectDestinations } from "./destinations-projects";
import { reachDestinations } from "./destinations-reach";
import { stanceDestinations } from "./destinations-stance";
import { timelineDestinations } from "./destinations-timeline";
import { toolingDestinations } from "./destinations-tooling";

const all: readonly Destination[] = [
  ...coreDestinations,
  ...experienceDestinations,
  ...projectDestinations,
  ...craftDestinations,
  ...openSourceDestinations,
  ...explorationDestinations,
  ...reachDestinations,
  ...stanceDestinations,
  ...toolingDestinations,
  ...timelineDestinations,
];

const bySlug = new Map<RouteKey, Destination>(all.map((d) => [d.slug, d]));

export const worldDestinations: readonly Destination[] = STATION_ORDER.map((slug) => {
  const destination = bySlug.get(slug);
  if (!destination) throw new Error(`Missing world destination for "${slug}".`);
  return destination;
});

export function getDestination(slug: RouteKey): Destination {
  const destination = bySlug.get(slug);
  if (!destination) throw new Error(`Unknown world destination "${slug}".`);
  return destination;
}

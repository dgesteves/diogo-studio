import type { RouteKey } from "@/constants/routes";
import type { Destination } from "../types";
import { coreDestinations } from "./destinations-core";
import { craftDestinations } from "./destinations-craft";
import { experienceDestinations } from "./destinations-experience";
import { explorationDestinations } from "./destinations-explorations";
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
  ...explorationDestinations,
  ...reachDestinations,
  ...stanceDestinations,
  ...toolingDestinations,
  ...timelineDestinations,
];

const ORDER: readonly RouteKey[] = [
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

const bySlug = new Map<RouteKey, Destination>(all.map((d) => [d.slug, d]));

export const worldDestinations: readonly Destination[] = ORDER.map((slug) => {
  const destination = bySlug.get(slug);
  if (!destination) throw new Error(`Missing world destination for "${slug}".`);
  return destination;
});

export function getDestination(slug: RouteKey): Destination {
  const destination = bySlug.get(slug);
  if (!destination) throw new Error(`Unknown world destination "${slug}".`);
  return destination;
}

import { STATION_ORDER, type RouteKey } from "./pages";
import type { Destination } from "./schema";
import { about } from "./prose/about";
import { caseStudies } from "./prose/case-studies";
import { contact } from "./prose/contact";
import { home } from "./prose/home";
import { lab } from "./prose/lab";
import { now } from "./prose/now";
import { openSource } from "./prose/open-source";
import { playground } from "./prose/playground";
import { principles } from "./prose/principles";
import { projects } from "./prose/projects";
import { resume } from "./prose/resume";
import { speaking } from "./prose/speaking";
import { stack } from "./prose/stack";
import { timeline } from "./prose/timeline";
import { uses } from "./prose/uses";
import { work } from "./prose/work";
import { writing } from "./prose/writing";

/**
 * The authored record, whole: every page's prose joined to the page list. Server-side
 * only — a client island reads `./pages` instead, which carries no `blocks`.
 */
const bySlug: Record<RouteKey, Destination> = {
  home,
  about,
  work,
  projects,
  caseStudies,
  writing,
  speaking,
  openSource,
  playground,
  resume,
  now,
  contact,
  principles,
  stack,
  uses,
  timeline,
  lab,
};

export const worldDestinations: readonly Destination[] = STATION_ORDER.map((slug) => bySlug[slug]);

export function getDestination(slug: RouteKey): Destination {
  return bySlug[slug];
}

export const routes = {
  home: "/",
  about: "/about",
  work: "/work",
  projects: "/projects",
  caseStudies: "/case-studies",
  writing: "/writing",
  speaking: "/speaking",
  openSource: "/open-source",
  playground: "/playground",
  resume: "/resume",
  now: "/now",
  contact: "/contact",
  principles: "/principles",
  stack: "/stack",
  uses: "/uses",
  timeline: "/timeline",
  lab: "/lab",
} as const;

export type RouteKey = keyof typeof routes;
export type RoutePath = (typeof routes)[RouteKey];

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

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

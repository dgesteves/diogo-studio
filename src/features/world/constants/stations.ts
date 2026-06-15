import type { RouteKey } from "@/constants/routes";
import type { Vec3, WorldObjectKind, WorldStation } from "../types";

type RawStation = readonly [WorldObjectKind, string, string, Vec3, Vec3];

const RAW: Record<RouteKey, RawStation> = {
  home: ["neon-sign", "STUDIO", "#22d3ee", [4.4, 2.7, 5.4], [0, 1.05, -0.3]],
  about: ["monitor-center", "ABOUT", "#67e8f9", [1.5, 1.8, 3.0], [0, 1.3, -0.3]],
  work: ["monitor-left", "WORK", "#38bdf8", [-1.1, 1.7, 2.7], [-1.04, 1.2, -0.26]],
  projects: ["monitor-right", "PROJECTS", "#818cf8", [1.1, 1.7, 2.7], [1.04, 1.2, -0.26]],
  caseStudies: ["monitor-center", "CASE STUDIES", "#a78bfa", [0, 1.65, 2.4], [0, 1.25, -0.34]],
  writing: ["bookshelf", "WRITING", "#f472b6", [-1.3, 1.7, 1.6], [-2.0, 1.4, -0.6]],
  speaking: ["speaker-stack", "SPEAKING", "#fb7185", [1.7, 1.4, 2.1], [1.6, 0.95, -0.4]],
  openSource: ["server-rack", "OPEN SOURCE", "#34d399", [1.9, 1.5, 1.3], [2.0, 1.0, -0.85]],
  playground: ["arcade", "PLAYGROUND", "#facc15", [-1.7, 1.4, 2.3], [-1.85, 0.85, 0.4]],
  resume: ["frame", "RESUME", "#22d3ee", [0.5, 1.9, 2.3], [0, 1.85, -2.2]],
  now: ["coffee", "NOW", "#fbbf24", [0.8, 1.35, 1.8], [0.6, 0.9, 0.05]],
  contact: ["door", "CONTACT", "#5eead4", [-1.6, 1.7, 2.7], [-2.1, 1.2, 1.2]],
  principles: ["poster", "PRINCIPLES", "#c084fc", [0, 2.0, 2.0], [0, 2.25, -2.2]],
  stack: ["whiteboard", "STACK", "#7dd3fc", [1.5, 1.85, 1.7], [1.7, 1.6, -1.8]],
  uses: ["monitor-center", "USES", "#67e8f9", [0, 1.85, 3.2], [0, 1.05, -0.3]],
  timeline: ["neon-sign", "TIMELINE", "#a78bfa", [0, 2.05, 2.7], [0, 1.65, -2.2]],
  lab: ["plant", "LAB", "#4ade80", [-1.9, 1.55, 1.7], [-2.0, 1.0, 0.2]],
};

function toStation(slug: RouteKey, raw: RawStation): WorldStation {
  const [object, neon, accent, position, target] = raw;
  return { slug, object, neon, accent, position, target, anchor: target };
}

export const worldStations: Record<RouteKey, WorldStation> = Object.fromEntries(
  (Object.keys(RAW) as RouteKey[]).map((slug) => [slug, toStation(slug, RAW[slug])]),
) as Record<RouteKey, WorldStation>;

export function getStation(slug: RouteKey): WorldStation {
  return worldStations[slug];
}

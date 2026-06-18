import type { RouteKey } from "@/constants/routes";
import type { Vec3, WorldObjectKind, WorldStation } from "../types";

type RawStation = readonly [WorldObjectKind, string, string, Vec3, Vec3];

const RAW: Record<RouteKey, RawStation> = {
  home: ["neon-sign", "STUDIO", "#22d3ee", [4.4, 2.7, 5.4], [0, 1.05, -0.3]],
  about: ["monitor-center", "ABOUT", "#67e8f9", [1.5, 1.8, 3.0], [0, 1.3, -0.3]],
  work: ["monitor-left", "WORK", "#38bdf8", [-1.1, 1.7, 2.7], [-1.04, 1.2, -0.26]],
  projects: ["monitor-right", "PROJECTS", "#818cf8", [1.1, 1.7, 2.7], [1.04, 1.2, -0.26]],
  caseStudies: ["monitor-center", "CASE STUDIES", "#a78bfa", [0, 1.65, 2.4], [-0.6, 0.92, 0.34]],
  writing: ["bookshelf", "WRITING", "#f472b6", [-1.3, 1.7, 1.6], [-2.0, 1.4, -0.6]],
  speaking: ["speaker-stack", "SPEAKING", "#fb7185", [1.7, 1.4, 2.1], [1.38, 1.12, -0.1]],
  openSource: ["tv", "OPEN SOURCE", "#34d399", [1.8, 1.85, 2.0], [3.6, 1.05, -1.5]],
  playground: ["arcade", "PLAYGROUND", "#facc15", [0.86, 1.7, 1.6], [1.56, 1.12, -2.18]],
  resume: ["frame", "RESUME", "#22d3ee", [-0.86, 1.7, 1.6], [-1.56, 1.12, -2.18]],
  now: ["coffee", "NOW", "#fbbf24", [0.8, 1.35, 1.8], [0.95, 0.96, 0.3]],
  contact: ["door", "CONTACT", "#5eead4", [-1.6, 1.7, 2.7], [-2.1, 1.2, 1.2]],
  principles: ["poster", "PRINCIPLES", "#c084fc", [0, 1.7, 1.6], [0, 1.12, -2.18]],
  stack: ["whiteboard", "STACK", "#7dd3fc", [0.43, 1.7, 1.6], [0.78, 1.12, -2.18]],
  uses: ["monitor-center", "USES", "#67e8f9", [0, 1.85, 3.2], [-0.05, 0.95, 0.32]],
  timeline: ["timeline-strip", "TIMELINE", "#a78bfa", [-0.43, 1.7, 1.6], [-0.78, 1.12, -2.18]],
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

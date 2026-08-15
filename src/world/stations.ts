"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { type RouteKey, resolveStation } from "@/content/pages";
import { WALL_SCREEN, WALL_SCREEN_Z, type WallScreenSlug } from "./room";
import { getWorldServerSnapshot, getWorldSnapshot, subscribeWorld } from "./store";

/**
 * The spatial record: where each page's station sits, what object represents it, and the two
 * hooks that answer which one is active and which one is hovered. The pages themselves come
 * from `content/pages`; this file only says where they are in the room.
 */

export const worldObjectKinds = [
  "monitor-left",
  "monitor-center",
  "monitor-right",
  "neon-sign",
  "bookshelf",
  "server-rack",
  "tv",
  "speaker-stack",
  "plant",
  "coffee",
  "door",
  "poster",
  "whiteboard",
  "arcade",
  "frame",
  "timeline-strip",
] as const;

type WorldObjectKind = (typeof worldObjectKinds)[number];

export type Vec3 = readonly [number, number, number];

export type WorldStation = {
  slug: RouteKey;
  neon: string;
  accent: string;
  position: Vec3;
  target: Vec3;
  anchor: Vec3;
  object: WorldObjectKind;
};

type RawStation = readonly [WorldObjectKind, string, string, Vec3, Vec3];

const WALL_TARGET_INSET = 0.09;
const WALL_TARGET_Y = 1.12;
const WALL_CAMERA_Y = 1.7;
const WALL_CAMERA_DISTANCE = 3.78;
const WALL_CAMERA_FAN = 0.45;

/**
 * Frames a right-wall screen head-on from inside the room, fanning the camera
 * back towards the row's center so neighboring panels stay in shot.
 */
function wallFraming(slug: WallScreenSlug): readonly [Vec3, Vec3] {
  const z = WALL_SCREEN_Z[slug];
  const targetX = WALL_SCREEN.x - WALL_TARGET_INSET;
  const cameraZ = z - (z - WALL_SCREEN.centerZ) * WALL_CAMERA_FAN;
  return [
    [targetX - WALL_CAMERA_DISTANCE, WALL_CAMERA_Y, cameraZ],
    [targetX, WALL_TARGET_Y, z],
  ];
}

const RAW: Record<RouteKey, RawStation> = {
  home: ["neon-sign", "STUDIO", "#22d3ee", [4.4, 2.7, 5.4], [0, 1.05, -0.3]],
  about: ["monitor-center", "ABOUT", "#67e8f9", [1.5, 1.8, 3.0], [0, 1.3, -0.3]],
  work: ["monitor-left", "WORK", "#38bdf8", [-1.1, 1.7, 2.7], [-1.04, 1.2, -0.26]],
  projects: ["monitor-right", "PROJECTS", "#818cf8", [1.1, 1.7, 2.7], [1.04, 1.2, -0.26]],
  caseStudies: ["monitor-center", "CASE STUDIES", "#a78bfa", [0, 1.65, 2.4], [-0.6, 0.92, 0.34]],
  writing: ["bookshelf", "WRITING", "#f472b6", [-0.7, 1.7, 4.6], [-2.0, 1.4, 3.7]],
  speaking: ["speaker-stack", "SPEAKING", "#fb7185", [1.7, 1.4, 2.1], [1.38, 1.12, -0.1]],
  openSource: ["tv", "OPEN SOURCE", "#34d399", [1.8, 1.85, 2.0], [3.6, 1.05, -1.5]],
  playground: ["arcade", "PLAYGROUND", "#facc15", ...wallFraming("playground")],
  resume: ["frame", "RESUME", "#22d3ee", ...wallFraming("resume")],
  now: ["coffee", "NOW", "#fbbf24", [0.8, 1.35, 1.8], [0.95, 0.96, 0.3]],
  contact: ["door", "CONTACT", "#5eead4", [-1.2, 1.6, 3.38], [-2.1, 1.2, 2.28]],
  principles: ["poster", "PRINCIPLES", "#c084fc", ...wallFraming("principles")],
  stack: ["whiteboard", "STACK", "#7dd3fc", ...wallFraming("stack")],
  uses: ["monitor-center", "USES", "#67e8f9", [0, 1.85, 3.2], [-0.05, 0.95, 0.32]],
  timeline: ["timeline-strip", "TIMELINE", "#a78bfa", ...wallFraming("timeline")],
  lab: ["plant", "LAB", "#4ade80", [-0.7, 1.35, 2.5], [-1.8, 0.95, 1.4]],
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

export function useHoveredStation(): RouteKey | null {
  const state = useSyncExternalStore(subscribeWorld, getWorldSnapshot, getWorldServerSnapshot);
  return state.hovered;
}

export function useActiveStation(): RouteKey {
  const pathname = usePathname();
  return resolveStation(pathname);
}

import type { RouteKey } from "@/content/pages";

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

export type WorldObjectKind = (typeof worldObjectKinds)[number];

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

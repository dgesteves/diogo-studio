import type { RouteKey } from "@/content/pages";
import type { WorldObjectKind } from "./constants/object-kinds";

export type Vec3 = readonly [number, number, number];

export type { WorldObjectKind };

export type WorldStation = {
  slug: RouteKey;
  neon: string;
  accent: string;
  position: Vec3;
  target: Vec3;
  anchor: Vec3;
  object: WorldObjectKind;
};

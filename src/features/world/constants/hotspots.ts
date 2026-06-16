import type { RouteKey } from "@/constants/routes";
import type { Vec3 } from "../types";

export type FurnitureHotspot = {
  center: Vec3;
  size: Vec3;
  groundY: number;
};

const FLOOR_Y = 0.02;

export const furnitureHotspots = {
  about: { center: [0, 1.2, -0.34], size: [1.1, 0.7, 0.22], groundY: FLOOR_Y },
  work: { center: [-1.044, 1.2, -0.262], size: [1.15, 0.7, 0.32], groundY: FLOOR_Y },
  projects: { center: [1.044, 1.2, -0.262], size: [1.15, 0.7, 0.32], groundY: FLOOR_Y },
  writing: { center: [-2.18, 1.15, -0.6], size: [0.4, 2.3, 1.15], groundY: FLOOR_Y },
  speaking: { center: [1.38, 0.9, -0.1], size: [0.3, 0.55, 0.3], groundY: FLOOR_Y },
  openSource: { center: [2.0, 0.85, -0.85], size: [0.65, 1.75, 0.65], groundY: FLOOR_Y },
  lab: { center: [-2.0, 0.5, 0.2], size: [0.75, 1.05, 0.75], groundY: FLOOR_Y },
} as const satisfies Partial<Record<RouteKey, FurnitureHotspot>>;

type FurnitureRoute = keyof typeof furnitureHotspots;

export function isFurnitureRoute(slug: RouteKey): slug is FurnitureRoute {
  return slug in furnitureHotspots;
}

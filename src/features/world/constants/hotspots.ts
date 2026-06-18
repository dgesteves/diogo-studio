import type { RouteKey } from "@/constants/routes";
import type { Vec3 } from "../types";

export type FurnitureHotspot =
  | { center: Vec3; size: Vec3; glow: "floor"; groundY: number }
  | { center: Vec3; size: Vec3; glow: "wall" };

const FLOOR_Y = 0.02;
const DESK_Y = 0.74;
const WALL_Y = 1.5;
const WALL_Z = -2.27;
const WALL_SIZE = [0.58, 0.74, 0.12] as const satisfies Vec3;

export const furnitureHotspots = {
  about: { center: [0, 1.2, -0.34], size: [1.1, 0.7, 0.22], glow: "floor", groundY: FLOOR_Y },
  work: { center: [-1.044, 1.2, -0.262], size: [1.15, 0.7, 0.32], glow: "floor", groundY: FLOOR_Y },
  projects: {
    center: [1.044, 1.2, -0.262],
    size: [1.15, 0.7, 0.32],
    glow: "floor",
    groundY: FLOOR_Y,
  },
  writing: { center: [-2.18, 1.15, -0.6], size: [0.4, 2.3, 1.15], glow: "floor", groundY: FLOOR_Y },
  speaking: { center: [1.38, 0.9, -0.1], size: [0.3, 0.55, 0.3], glow: "floor", groundY: FLOOR_Y },
  openSource: {
    center: [3.6, 1.5, -2.25],
    size: [1.8, 1.1, 0.5],
    glow: "floor",
    groundY: FLOOR_Y,
  },
  lab: { center: [-2.0, 0.5, 0.2], size: [0.75, 1.05, 0.75], glow: "floor", groundY: FLOOR_Y },
  caseStudies: {
    center: [-0.6, 0.8, 0.34],
    size: [0.28, 0.16, 0.38],
    glow: "floor",
    groundY: DESK_Y,
  },
  now: { center: [0.95, 0.8, 0.3], size: [0.18, 0.2, 0.18], glow: "floor", groundY: DESK_Y },
  contact: { center: [-2.25, 1.05, 1.2], size: [0.16, 2.0, 0.95], glow: "floor", groundY: FLOOR_Y },
  uses: { center: [0, 0.78, 0.32], size: [0.7, 0.16, 0.34], glow: "floor", groundY: DESK_Y },
  resume: { center: [-1.56, WALL_Y, WALL_Z], size: WALL_SIZE, glow: "wall" },
  timeline: { center: [-0.78, WALL_Y, WALL_Z], size: WALL_SIZE, glow: "wall" },
  principles: { center: [0, WALL_Y, WALL_Z], size: WALL_SIZE, glow: "wall" },
  stack: { center: [0.78, WALL_Y, WALL_Z], size: WALL_SIZE, glow: "wall" },
  playground: { center: [1.56, WALL_Y, WALL_Z], size: WALL_SIZE, glow: "wall" },
} as const satisfies Partial<Record<RouteKey, FurnitureHotspot>>;

type FurnitureRoute = keyof typeof furnitureHotspots;

export function isFurnitureRoute(slug: RouteKey): slug is FurnitureRoute {
  return slug in furnitureHotspots;
}

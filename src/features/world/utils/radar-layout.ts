import type { RouteKey, RoutePath } from "@/constants/routes";
import { worldDestinations } from "../constants/destinations";
import { getStation } from "../constants/stations";

export type RadarPoint = {
  slug: RouteKey;
  label: string;
  href: RoutePath;
  accent: string;
  x: number;
  y: number;
};

const EDGE_PADDING = 0.12;

function normalize(value: number, min: number, span: number): number {
  return EDGE_PADDING + ((value - min) / span) * (1 - EDGE_PADDING * 2);
}

export function buildRadarPoints(): readonly RadarPoint[] {
  const projected = worldDestinations.map((destination) => {
    const station = getStation(destination.slug);
    const [x, , z] = station.position;
    return { destination, station, x, z };
  });

  const xs = projected.map((p) => p.x);
  const zs = projected.map((p) => p.z);
  const minX = Math.min(...xs);
  const minZ = Math.min(...zs);
  const spanX = Math.max(...xs) - minX || 1;
  const spanZ = Math.max(...zs) - minZ || 1;

  return projected.map(({ destination, station, x, z }) => ({
    slug: destination.slug,
    label: destination.label,
    href: destination.href,
    accent: station.accent,
    x: normalize(x, minX, spanX),
    y: normalize(z, minZ, spanZ),
  }));
}

export const radarPoints: readonly RadarPoint[] = buildRadarPoints();

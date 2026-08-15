"use client";

import { type RouteKey, type RoutePath, stationIndex, getStationEntry } from "@/content/pages";
import { getStation, useActiveStation, useHoveredStation } from "../stations";
import { Fragment, type ReactElement } from "react";
import { cn } from "@/ui/cn";
import { Maximize2 } from "lucide-react";

/** The radar on the deck: where every station sits relative to the one you are on. */

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
  const projected = stationIndex.map((destination) => {
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

type DeckRadarPlotProps = {
  active: RouteKey;
  hovered: RouteKey | null;
};

function DeckRadarPlot({ active, hovered }: DeckRadarPlotProps): ReactElement {
  return (
    <span aria-hidden="true" className="relative block size-full overflow-hidden rounded-md">
      <span className="deck-radar-grid absolute inset-0 opacity-60" />
      <span className="deck-radar-sweep absolute inset-0 motion-reduce:hidden" />
      {radarPoints.map((point) => {
        const isActive = point.slug === active;
        const isHovered = point.slug === hovered;
        return (
          <Fragment key={point.slug}>
            {isActive && (
              <span
                className="deck-radar-ping absolute size-1.5 rounded-full motion-reduce:hidden"
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  border: `1px solid ${point.accent}`,
                }}
              />
            )}
            <span
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200",
                isActive ? "size-1.5" : "size-1",
                !isActive && !isHovered && "opacity-60",
              )}
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                backgroundColor: point.accent,
                boxShadow: isActive || isHovered ? `0 0 6px ${point.accent}` : undefined,
              }}
            />
          </Fragment>
        );
      })}
    </span>
  );
}

type DeckRadarProps = {
  mapOpen: boolean;
  onOpenMap: () => void;
};

const destinationCount = stationIndex.length;

export function DeckRadar({ mapOpen, onOpenMap }: DeckRadarProps): ReactElement {
  const active = useActiveStation();
  const hovered = useHoveredStation();
  const current = getStationEntry(active);

  return (
    <button
      type="button"
      onClick={onOpenMap}
      aria-haspopup="dialog"
      aria-expanded={mapOpen}
      aria-label={`Open studio map — ${destinationCount} destinations`}
      className="group focus-visible:ring-ring hover:bg-surface-muted flex items-center gap-2.5 rounded-xl py-1 pr-1 pl-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="border-border/70 group-hover:border-accent/60 bg-surface-inset/70 relative size-10 shrink-0 rounded-md border transition-all duration-200 group-hover:scale-105 group-focus-visible:scale-105">
        <DeckRadarPlot active={active} hovered={hovered} />
      </span>
      <span className="hidden flex-col items-start leading-tight sm:flex">
        <span className="text-subtle-foreground font-mono text-[9px] tracking-[0.2em] uppercase">
          Studio map
        </span>
        <span className="text-foreground font-mono text-[11px] tracking-wide">{current.label}</span>
      </span>
      <span
        aria-hidden="true"
        className="border-border/60 bg-surface-inset/60 text-subtle-foreground group-hover:border-accent/50 group-hover:text-foreground ml-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-1 font-mono text-[10px] tracking-wide transition-colors"
      >
        <Maximize2 className="size-3" />
        {destinationCount}
      </span>
    </button>
  );
}

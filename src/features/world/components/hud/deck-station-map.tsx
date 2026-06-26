"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import type { RouteKey } from "@/constants/routes";
import { setHoveredStation } from "@/stores/world-store";
import { cn } from "@/utils/cn";
import { radarPoints } from "../../utils/radar-layout";

type DeckStationMapProps = {
  active: RouteKey;
  hovered: RouteKey | null;
  onSelect: () => void;
};

export function DeckStationMap({ active, hovered, onSelect }: DeckStationMapProps): ReactElement {
  return (
    <div className="border-border/70 bg-surface-inset/60 relative aspect-4/3 w-full overflow-hidden rounded-xl border">
      <span aria-hidden="true" className="deck-radar-grid absolute inset-0 opacity-50" />
      <span
        aria-hidden="true"
        className="deck-radar-sweep absolute inset-0 opacity-70 motion-reduce:hidden"
      />
      {radarPoints.map((point) => {
        const isActive = point.slug === active;
        const isHovered = point.slug === hovered;
        return (
          <Link
            key={point.slug}
            href={point.href}
            onClick={onSelect}
            aria-current={isActive ? "page" : undefined}
            onMouseEnter={() => setHoveredStation(point.slug)}
            onMouseLeave={() => setHoveredStation(null)}
            onFocus={() => setHoveredStation(point.slug)}
            onBlur={() => setHoveredStation(null)}
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
            className="group focus-visible:ring-ring absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className={cn(
                "block rounded-full transition-transform duration-200 group-hover:scale-150 group-focus-visible:scale-150",
                isActive ? "size-2.5" : "size-2",
              )}
              style={{
                backgroundColor: point.accent,
                boxShadow: isActive || isHovered ? `0 0 8px ${point.accent}` : undefined,
              }}
            />
            <span
              className={cn(
                "bg-background/90 text-foreground pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded px-1.5 py-0.5 font-mono text-[9px] tracking-wide whitespace-nowrap uppercase transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
                isActive ? "opacity-100" : "opacity-0",
              )}
            >
              {point.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

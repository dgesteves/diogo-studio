"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import type { RouteKey } from "@/constants/routes";
import { setHoveredStation } from "@/stores/world-store";
import { cn } from "@/utils/cn";
import { worldSectors } from "../../constants/sectors";
import { getStation } from "../../constants/stations";

type DeckSectorListProps = {
  active: RouteKey;
  hovered: RouteKey | null;
  onSelect: () => void;
};

export function DeckSectorList({ active, hovered, onSelect }: DeckSectorListProps): ReactElement {
  return (
    <nav aria-label="All studio destinations" className="grid grid-cols-2 gap-x-5 gap-y-3.5">
      {worldSectors.map((sector) => (
        <section key={sector.label}>
          <h3 className="text-subtle-foreground font-mono text-[9px] tracking-[0.22em] uppercase">
            {sector.label}
          </h3>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {sector.destinations.map((destination) => {
              const isActive = destination.slug === active;
              const isHovered = destination.slug === hovered;
              const { accent } = getStation(destination.slug);
              return (
                <li key={destination.slug}>
                  <Link
                    href={destination.href}
                    onClick={onSelect}
                    aria-current={isActive ? "page" : undefined}
                    onMouseEnter={() => setHoveredStation(destination.slug)}
                    onMouseLeave={() => setHoveredStation(null)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors",
                      isActive
                        ? "bg-accent-soft/50 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-muted",
                      isHovered && !isActive && "text-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: accent,
                        boxShadow: isActive || isHovered ? `0 0 6px ${accent}` : undefined,
                      }}
                    />
                    <span className="truncate">{destination.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}

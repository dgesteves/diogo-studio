"use client";

import type { ReactElement } from "react";
import { Maximize2 } from "lucide-react";
import { getDestination, worldDestinations } from "../../constants/destinations";
import { useActiveStation } from "../../hooks/use-active-station";
import { useHoveredStation } from "../../hooks/use-hovered-station";
import { DeckRadarPlot } from "./deck-radar-plot";

type DeckRadarProps = {
  mapOpen: boolean;
  onOpenMap: () => void;
};

const destinationCount = worldDestinations.length;

export function DeckRadar({ mapOpen, onOpenMap }: DeckRadarProps): ReactElement {
  const active = useActiveStation();
  const hovered = useHoveredStation();
  const current = getDestination(active);

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

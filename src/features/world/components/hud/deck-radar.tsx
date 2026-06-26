"use client";

import type { ReactElement } from "react";
import { getDestination } from "../../constants/destinations";
import { useActiveStation } from "../../hooks/use-active-station";
import { useHoveredStation } from "../../hooks/use-hovered-station";
import { DeckRadarPlot } from "./deck-radar-plot";

type DeckRadarProps = {
  mapOpen: boolean;
  onOpenMap: () => void;
};

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
      aria-label="Open studio map"
      className="group focus-visible:ring-ring hover:bg-surface-muted flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="border-border/70 group-hover:border-accent/50 bg-surface-inset/70 relative size-9 shrink-0 rounded-md border transition-colors">
        <DeckRadarPlot active={active} hovered={hovered} />
      </span>
      <span className="hidden flex-col items-start leading-tight sm:flex">
        <span className="text-subtle-foreground font-mono text-[9px] tracking-[0.2em] uppercase">
          Studio map
        </span>
        <span className="text-foreground font-mono text-[11px] tracking-wide">{current.label}</span>
      </span>
    </button>
  );
}

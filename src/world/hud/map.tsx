"use client";

import { type ReactElement } from "react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import { StatusDot } from "@/components/ui/status-dot";
import { siteConfig } from "@/content/profile";
import Link from "next/link";
import { type RouteKey, stationSectors } from "@/content/pages";
import { setHoveredStation } from "@/world/store";
import { cn } from "@/utils/cn";
import { getStation, useActiveStation, useHoveredStation } from "../stations";
import { radarPoints } from "./radar";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/**
 * The station map the deck opens: the sector list, the plotted rooms and the comms line. All
 * three read one record from `content/pages`, so a page added there appears here for free.
 */

export function DeckComms(): ReactElement {
  const year = new Date().getFullYear();

  return (
    <div className="border-border/70 mt-auto flex flex-col gap-2.5 border-t pt-4">
      <div className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase">
        <StatusDot tone="good" />
        <span>Available — Staff+, Principal, Founding, VP Eng</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <a
          href={`mailto:${siteConfig.email}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {siteConfig.email}
        </a>
        <a
          href={siteConfig.links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <LinkedinIcon className="size-3.5" />
          LinkedIn
        </a>
        <a
          href={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <GithubIcon className="size-3.5" />
          GitHub
        </a>
      </div>
      <p className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
        © {year} {siteConfig.name}
      </p>
    </div>
  );
}

type DeckSectorListProps = {
  active: RouteKey;
  hovered: RouteKey | null;
  onSelect: () => void;
};

function DeckSectorList({ active, hovered, onSelect }: DeckSectorListProps): ReactElement {
  return (
    <nav aria-label="All studio destinations" className="grid grid-cols-2 gap-x-5 gap-y-3.5">
      {stationSectors.map((sector) => (
        <section key={sector.label}>
          <h3 className="text-subtle-foreground font-mono text-[9px] tracking-[0.22em] uppercase">
            {sector.label}
          </h3>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {sector.stations.map((destination) => {
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

type DeckStationMapProps = {
  active: RouteKey;
  hovered: RouteKey | null;
  onSelect: () => void;
};

function DeckStationMap({ active, hovered, onSelect }: DeckStationMapProps): ReactElement {
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

type DeckMapOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeckMapOverlay({ open, onOpenChange }: DeckMapOverlayProps): ReactElement {
  const active = useActiveStation();
  const hovered = useHoveredStation();
  const close = (): void => onOpenChange(false);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-background/70 data-[state=open]:animate-in data-[state=open]:fade-in fixed inset-0 z-50 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="border-border-strong bg-surface/95 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border p-5 shadow-2xl backdrop-blur-xl outline-none sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-accent font-mono text-[10px] tracking-[0.22em] uppercase">
                Studio map
              </p>
              <Dialog.Title className="text-foreground mt-1.5 text-xl font-medium tracking-tight">
                Navigate the studio
              </Dialog.Title>
            </div>
            <Dialog.Close
              aria-label="Close studio map"
              className="text-subtle-foreground hover:text-foreground hover:bg-surface-muted focus-visible:ring-ring grid size-8 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.35fr)]">
            <DeckStationMap active={active} hovered={hovered} onSelect={close} />
            <DeckSectorList active={active} hovered={hovered} onSelect={close} />
          </div>

          <div className="mt-5">
            <DeckComms />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

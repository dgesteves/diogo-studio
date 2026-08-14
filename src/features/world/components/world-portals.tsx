"use client";

import { type ReactElement } from "react";
import type { RouteKey } from "@/content/pages";
import { stationIndex } from "@/content/pages";
import { furnitureHotspots, isFurnitureRoute } from "../constants/hotspots";
import { getStation } from "../constants/stations";
import { useHoveredStation } from "../hooks/use-hovered-station";
import { FurnitureHotspot } from "./furniture-hotspot";
import { HotspotFocusLight } from "./hotspot-focus-light";

export function WorldPortals({ active }: { active: RouteKey }): ReactElement {
  const hovered = useHoveredStation();

  return (
    <>
      <HotspotFocusLight slug={hovered} />
      <HotspotFocusLight slug={isFurnitureRoute(active) ? active : null} />

      {stationIndex.map((destination) => {
        if (!isFurnitureRoute(destination.slug)) return null;
        return (
          <FurnitureHotspot
            key={destination.slug}
            station={getStation(destination.slug)}
            hotspot={furnitureHotspots[destination.slug]}
            label={destination.label}
            active={active === destination.slug}
          />
        );
      })}
    </>
  );
}

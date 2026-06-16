"use client";

import { type ReactElement } from "react";
import { useRouter } from "next/navigation";
import type { RouteKey } from "@/constants/routes";
import { worldDestinations } from "../content/destinations";
import { furnitureHotspots, isFurnitureRoute } from "../constants/hotspots";
import { getStation } from "../constants/stations";
import { FurnitureHotspot } from "./furniture-hotspot";

export function WorldPortals({ active }: { active: RouteKey }): ReactElement {
  const router = useRouter();

  return (
    <>
      {worldDestinations.map((destination) => {
        if (!isFurnitureRoute(destination.slug)) return null;
        return (
          <FurnitureHotspot
            key={destination.slug}
            station={getStation(destination.slug)}
            hotspot={furnitureHotspots[destination.slug]}
            label={destination.label}
            active={active === destination.slug}
            onSelect={() => router.push(destination.href)}
          />
        );
      })}
    </>
  );
}

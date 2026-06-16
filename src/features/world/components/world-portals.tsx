"use client";

import { type ReactElement } from "react";
import { useRouter } from "next/navigation";
import type { RouteKey } from "@/constants/routes";
import { worldDestinations } from "../content/destinations";
import { furnitureHotspots, isFurnitureRoute } from "../constants/hotspots";
import { getStation } from "../constants/stations";
import { FurnitureHotspot } from "./furniture-hotspot";
import { PortalMarker } from "./portal-marker";

export function WorldPortals({ active }: { active: RouteKey }): ReactElement {
  const router = useRouter();

  return (
    <>
      {worldDestinations
        .filter((destination) => destination.slug !== "home")
        .map((destination) => {
          const station = getStation(destination.slug);
          const onSelect = (): void => {
            router.push(destination.href);
          };

          if (isFurnitureRoute(destination.slug)) {
            return (
              <FurnitureHotspot
                key={destination.slug}
                station={station}
                hotspot={furnitureHotspots[destination.slug]}
                label={destination.label}
                active={active === destination.slug}
                onSelect={onSelect}
              />
            );
          }

          return (
            <PortalMarker
              key={destination.slug}
              station={station}
              label={destination.label}
              active={active === destination.slug}
              onSelect={onSelect}
            />
          );
        })}
    </>
  );
}

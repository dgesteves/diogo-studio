"use client";

import { type ReactElement } from "react";
import { useRouter } from "next/navigation";
import type { RouteKey } from "@/constants/routes";
import { worldDestinations } from "../content/destinations";
import { getStation } from "../constants/stations";
import { PortalMarker } from "./portal-marker";

export function WorldPortals({ active }: { active: RouteKey }): ReactElement {
  const router = useRouter();

  return (
    <>
      {worldDestinations
        .filter((destination) => destination.slug !== "home")
        .map((destination) => (
          <PortalMarker
            key={destination.slug}
            station={getStation(destination.slug)}
            label={destination.label}
            active={active === destination.slug}
            onSelect={() => router.push(destination.href)}
          />
        ))}
    </>
  );
}

import { describe, expect, it } from "vitest";
import type { RouteKey } from "@/constants/routes";
import { worldDestinations } from "./destinations";
import { worldSectors } from "./sectors";

describe("worldSectors", () => {
  const sectorSlugs = worldSectors.flatMap((sector) => sector.destinations.map((d) => d.slug));

  it("covers every world destination exactly once", () => {
    expect(sectorSlugs).toHaveLength(worldDestinations.length);
    const seen = new Set<RouteKey>(sectorSlugs);
    expect(seen.size).toBe(sectorSlugs.length);
    for (const destination of worldDestinations) {
      expect(seen.has(destination.slug)).toBe(true);
    }
  });

  it("gives every sector a label and at least one destination", () => {
    for (const sector of worldSectors) {
      expect(sector.label.length).toBeGreaterThan(0);
      expect(sector.destinations.length).toBeGreaterThan(0);
    }
  });
});

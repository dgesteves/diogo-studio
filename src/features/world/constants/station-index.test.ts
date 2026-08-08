import { describe, expect, it } from "vitest";
import type { RouteKey } from "@/constants/routes";
import { routes } from "@/constants/routes";
import { worldDestinations } from "./destinations";
import { resolveStation, stationIndex, stationSectors } from "./station-index";

describe("stationIndex", () => {
  it("covers every route in routes.ts exactly once, in order", () => {
    expect(stationIndex.map((s) => s.href)).toEqual(Object.values(routes));
  });

  it("gives every station a non-empty label and the route's own href", () => {
    for (const station of stationIndex) {
      expect(station.label.length).toBeGreaterThan(0);
      expect(station.href).toBe(routes[station.slug]);
    }
  });

  // The scalar index and the content collection are separate modules so that
  // client islands never pull page prose into the bundle. That split is only safe
  // while the two agree, so assert it rather than trusting it.
  it("agrees with the destination content collection", () => {
    expect(worldDestinations).toHaveLength(stationIndex.length);
    worldDestinations.forEach((destination, i) => {
      const station = stationIndex[i];
      expect(station).toBeDefined();
      expect(destination.slug).toBe(station?.slug);
      expect(destination.href).toBe(station?.href);
      expect(destination.label).toBe(station?.label);
    });
  });
});

describe("stationSectors", () => {
  const sectorSlugs = stationSectors.flatMap((sector) => sector.stations.map((s) => s.slug));

  it("covers every station exactly once", () => {
    expect(sectorSlugs).toHaveLength(stationIndex.length);
    expect(new Set<RouteKey>(sectorSlugs).size).toBe(sectorSlugs.length);
    for (const station of stationIndex) {
      expect(sectorSlugs).toContain(station.slug);
    }
  });

  it("gives every sector a label and at least one station", () => {
    for (const sector of stationSectors) {
      expect(sector.label.length).toBeGreaterThan(0);
      expect(sector.stations.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveStation", () => {
  it("maps / and unknown paths to home", () => {
    expect(resolveStation("/")).toBe("home");
    expect(resolveStation(null)).toBe("home");
    expect(resolveStation("/nope")).toBe("home");
  });

  it("maps a route and its subpaths to that station", () => {
    expect(resolveStation("/work")).toBe("work");
    expect(resolveStation("/work/anything")).toBe("work");
    expect(resolveStation("/case-studies")).toBe("caseStudies");
  });
});

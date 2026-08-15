import { describe, expect, it } from "vitest";
import {
  asInternalHref,
  isPagePath,
  resolveStation,
  routes,
  stationIndex,
  stationSectors,
  type PageSlug,
} from "./pages";

describe("isPagePath", () => {
  it("accepts every declared route and nothing else", () => {
    for (const path of Object.values(routes)) {
      expect(isPagePath(path)).toBe(true);
    }
    expect(isPagePath("/nope")).toBe(false);
    expect(isPagePath("/work/")).toBe(false);
    expect(isPagePath("")).toBe(false);
  });
});

describe("asInternalHref", () => {
  it("passes through a real route", () => {
    expect(asInternalHref(routes.work)).toBe(routes.work);
    expect(asInternalHref(routes.home)).toBe(routes.home);
  });

  it("keeps a fragment on a real route", () => {
    expect(asInternalHref("/about#philosophy")).toBe("/about#philosophy");
    expect(asInternalHref("/about#")).toBe("/about#");
  });

  it("rejects an internal-looking href that is not a route", () => {
    expect(asInternalHref("/not-a-page")).toBeNull();
    expect(asInternalHref("/work/2024")).toBeNull();
  });

  it("rejects absolute, protocol-relative and scheme hrefs", () => {
    expect(asInternalHref("https://example.com/about")).toBeNull();
    expect(asInternalHref("//example.com/about")).toBeNull();
    expect(asInternalHref("javascript:alert(1)")).toBeNull();
    expect(asInternalHref("mailto:hi@example.com")).toBeNull();
  });

  it("rejects a bare fragment, which is not a route on its own", () => {
    expect(asInternalHref("#content")).toBeNull();
  });

  it("rejects a query string, since no route declares one", () => {
    expect(asInternalHref("/work?tab=all")).toBeNull();
  });
});

describe("stationIndex", () => {
  it("covers every route in the page list exactly once, in order", () => {
    expect(stationIndex.map((s) => s.href)).toEqual(Object.values(routes));
  });

  it("gives every station a non-empty label and the route's own href", () => {
    for (const station of stationIndex) {
      expect(station.label.length).toBeGreaterThan(0);
      expect(station.href).toBe(routes[station.slug]);
    }
  });
});

describe("stationSectors", () => {
  const sectorSlugs = stationSectors.flatMap((sector) => sector.stations.map((s) => s.slug));

  it("covers every station exactly once", () => {
    expect(sectorSlugs).toHaveLength(stationIndex.length);
    expect(new Set<PageSlug>(sectorSlugs).size).toBe(sectorSlugs.length);
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

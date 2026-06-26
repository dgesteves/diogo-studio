import { describe, expect, it } from "vitest";
import { worldDestinations } from "../constants/destinations";
import { buildRadarPoints, radarPoints } from "./radar-layout";

describe("buildRadarPoints", () => {
  it("projects every destination to a radar point", () => {
    expect(radarPoints).toHaveLength(worldDestinations.length);
    const slugs = new Set(radarPoints.map((p) => p.slug));
    for (const destination of worldDestinations) {
      expect(slugs.has(destination.slug)).toBe(true);
    }
  });

  it("keeps every point inside the padded unit square", () => {
    for (const point of buildRadarPoints()) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    }
  });

  it("carries label, href, and accent through from the destination", () => {
    const home = buildRadarPoints().find((p) => p.slug === "home");
    expect(home).toBeDefined();
    expect(home?.href).toBe("/");
    expect(home?.label.length).toBeGreaterThan(0);
    expect(home?.accent).toMatch(/^#/);
  });
});

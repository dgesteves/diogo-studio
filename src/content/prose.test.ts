import { describe, expect, it } from "vitest";
import { stationIndex } from "./pages";
import { getDestination, worldDestinations } from "./prose";

// The scalar page list and the prose collection are separate modules so that client
// islands never pull page prose into the bundle. That split is only safe while the two
// agree, so assert it rather than trusting it.
describe("worldDestinations", () => {
  it("agrees with the page list, entry for entry and in order", () => {
    expect(worldDestinations).toHaveLength(stationIndex.length);
    worldDestinations.forEach((destination, i) => {
      const station = stationIndex[i];
      expect(station).toBeDefined();
      expect(destination.slug).toBe(station?.slug);
      expect(destination.href).toBe(station?.href);
      expect(destination.label).toBe(station?.label);
    });
  });

  it("gives every page an eyebrow, a title, a summary and at least one block", () => {
    for (const destination of worldDestinations) {
      expect(destination.eyebrow.length).toBeGreaterThan(0);
      expect(destination.title.length).toBeGreaterThan(0);
      expect(destination.summary.length).toBeGreaterThan(0);
      expect(destination.blocks.length).toBeGreaterThan(0);
    }
  });
});

describe("getDestination", () => {
  it("returns the page authored for the slug", () => {
    for (const station of stationIndex) {
      expect(getDestination(station.slug).slug).toBe(station.slug);
    }
  });
});

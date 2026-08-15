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

  // A block id is rendered as an element id and cited as a URL fragment, so a duplicate
  // sends the reader to whichever one the browser finds first, and a space or a capital
  // makes a fragment that never resolves. Neither failure is visible on the page.
  it("gives every block a URL-safe id, unique within its page", () => {
    for (const destination of worldDestinations) {
      const ids = destination.blocks.map((block) => block.id);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(new Set(ids).size, `${destination.href} repeats a block id`).toBe(ids.length);
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

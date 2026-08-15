import { describe, expect, it } from "vitest";
import { routes } from "@/content/pages";
import { furnitureHotspots, isFurnitureRoute } from "./hotspots";
import { ROOM, WALL_SCREEN_Z, type WallScreenSlug } from "@/world/room";

const wallScreenSlugs = Object.keys(WALL_SCREEN_Z) as WallScreenSlug[];

describe("furniture hotspots", () => {
  it("references only known routes", () => {
    for (const slug of Object.keys(furnitureHotspots)) {
      expect(routes).toHaveProperty(slug);
    }
  });

  it("declares positive bounding sizes", () => {
    for (const hotspot of Object.values(furnitureHotspots)) {
      expect(hotspot.size.every((value) => value > 0)).toBe(true);
    }
  });

  it("recognizes furniture routes via the type guard", () => {
    expect(isFurnitureRoute("work")).toBe(true);
    expect(isFurnitureRoute("contact")).toBe(true);
    expect(isFurnitureRoute("resume")).toBe(true);
    expect(isFurnitureRoute("uses")).toBe(true);
    expect(isFurnitureRoute("home")).toBe(false);
  });

  it("covers every route except home", () => {
    expect(Object.keys(furnitureHotspots).length).toBe(Object.keys(routes).length - 1);
  });

  it("gives every wall-screen route a wall-oriented glow", () => {
    for (const slug of wallScreenSlugs) {
      expect(furnitureHotspots[slug].glow).toBe("wall");
    }
  });

  it("hangs the wall screens flat on the inside face of the right wall", () => {
    for (const slug of wallScreenSlugs) {
      const { center, size } = furnitureHotspots[slug];
      expect(center[0]).toBeLessThan(ROOM.maxX);
      expect(center[0]).toBeGreaterThan(ROOM.maxX - 0.1);
      expect(center[2]).toBeCloseTo(WALL_SCREEN_Z[slug]);
      expect(size[0]).toBeLessThan(size[2]);
    }
  });
});

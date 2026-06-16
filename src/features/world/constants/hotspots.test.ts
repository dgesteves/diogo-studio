import { describe, expect, it } from "vitest";
import { routes } from "@/constants/routes";
import { furnitureHotspots, isFurnitureRoute } from "./hotspots";

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
    for (const slug of ["resume", "timeline", "principles", "stack", "playground"] as const) {
      expect(furnitureHotspots[slug].glow).toBe("wall");
    }
  });
});

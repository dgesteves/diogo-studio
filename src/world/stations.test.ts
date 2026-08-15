import { describe, expect, it } from "vitest";
import { routes } from "@/content/pages";
import { worldObjectKinds } from "./stations";
import { worldStations } from "./stations";
import { ROOM, WALL_SCREEN, WALL_SCREEN_Z, type WallScreenSlug } from "./room";

describe("world object kinds", () => {
  it("declares each kind exactly once", () => {
    expect(new Set(worldObjectKinds).size).toBe(worldObjectKinds.length);
  });
});

describe("world stations", () => {
  it("provides a station for every route", () => {
    for (const slug of Object.keys(routes)) {
      expect(worldStations).toHaveProperty(slug);
    }
  });

  it("only references known bespoke object kinds", () => {
    const known = new Set<string>(worldObjectKinds);
    for (const station of Object.values(worldStations)) {
      expect(known.has(station.object)).toBe(true);
    }
  });

  it("maps the timeline destination to its bespoke neon strip", () => {
    expect(worldStations.timeline.object).toBe("timeline-strip");
  });

  it("frames each wall screen from inside the room, looking at the right wall", () => {
    for (const slug of Object.keys(WALL_SCREEN_Z) as WallScreenSlug[]) {
      const { position, target } = worldStations[slug];
      expect(target[2]).toBeCloseTo(WALL_SCREEN_Z[slug]);
      expect(target[0]).toBeLessThan(WALL_SCREEN.x);
      expect(position[0]).toBeLessThan(target[0]);
      expect(position[0]).toBeGreaterThan(ROOM.minX);
      expect(position[2]).toBeGreaterThan(ROOM.minZ);
      expect(position[2]).toBeLessThan(ROOM.maxZ);
    }
  });
});

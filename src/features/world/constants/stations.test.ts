import { describe, expect, it } from "vitest";
import { routes } from "@/constants/routes";
import { worldObjectKinds } from "./object-kinds";
import { worldStations } from "./stations";

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
});

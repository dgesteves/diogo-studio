import { describe, expect, it } from "vitest";
import {
  getWorldServerSnapshot,
  getWorldSnapshot,
  setAiCoreHovered,
  setHoveredStation,
  subscribeWorld,
} from "./world-store";

describe("world-store hover state", () => {
  it("tracks the hovered station and the AI core independently", () => {
    setHoveredStation("about");
    expect(getWorldSnapshot()).toEqual({ hovered: "about", aiCoreHovered: false });

    setAiCoreHovered(true);
    expect(getWorldSnapshot()).toEqual({ hovered: "about", aiCoreHovered: true });

    setHoveredStation(null);
    expect(getWorldSnapshot()).toEqual({ hovered: null, aiCoreHovered: true });
  });

  it("notifies subscribers once per real change", () => {
    let calls = 0;
    const unsubscribe = subscribeWorld(() => {
      calls += 1;
    });

    setHoveredStation("work");
    setHoveredStation("work");
    setAiCoreHovered(true);
    setAiCoreHovered(true);

    unsubscribe();
    setHoveredStation("contact");

    // Every hotspot pointer-move writes this store, so re-emitting an unchanged value
    // would re-render the whole HUD on mouse noise.
    expect(calls).toBe(2);
  });

  it("reports nothing hovered on the server", () => {
    setHoveredStation("about");
    setAiCoreHovered(true);

    expect(getWorldServerSnapshot()).toEqual({ hovered: null, aiCoreHovered: false });
  });
});

import { describe, expect, it } from "vitest";
import {
  getExploreServerSnapshot,
  getExploreSnapshot,
  getWorldModeServerSnapshot,
  getWorldModeSnapshot,
  getWorldServerSnapshot,
  getWorldSnapshot,
  setAiCoreHovered,
  setExplore,
  setHoveredStation,
  setWorldMode,
  subscribeExplore,
  subscribeWorld,
  subscribeWorldTheme,
  toggleExplore,
} from "./store";

/**
 * Three signals in one module, asserted separately: what the pointer is over, what time of day
 * the room is set to, and whether the camera is off the rails. They share a file because they
 * are the world's public state, not because they change together.
 */

describe("hover state", () => {
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

describe("day and night", () => {
  it("starts at night and switches on demand", () => {
    expect(getWorldModeSnapshot()).toBe("night");

    setWorldMode("day");
    expect(getWorldModeSnapshot()).toBe("day");

    setWorldMode("night");
    expect(getWorldModeSnapshot()).toBe("night");
  });

  it("notifies subscribers only when the mode actually changes", () => {
    let calls = 0;
    const unsubscribe = subscribeWorldTheme(() => {
      calls += 1;
    });

    setWorldMode("day");
    setWorldMode("day");
    setWorldMode("night");

    unsubscribe();
    setWorldMode("day");

    expect(calls).toBe(2);
  });

  it("renders night on the server, so the first paint matches the default", () => {
    setWorldMode("day");

    expect(getWorldModeServerSnapshot()).toBe("night");
  });
});

describe("explore mode", () => {
  it("toggles and reflects the active flag", () => {
    expect(getExploreSnapshot()).toBe(false);
    toggleExplore();
    expect(getExploreSnapshot()).toBe(true);
    toggleExplore();
    expect(getExploreSnapshot()).toBe(false);
  });

  it("notifies subscribers only on change", () => {
    let calls = 0;
    const unsubscribe = subscribeExplore(() => {
      calls += 1;
    });
    setExplore(true);
    setExplore(true);
    setExplore(false);
    unsubscribe();
    expect(calls).toBe(2);
  });

  it("leaves the camera on its rails on the server", () => {
    setExplore(true);

    expect(getExploreServerSnapshot()).toBe(false);
  });
});

describe("the three signals together", () => {
  it("keeps them independent, so a hover cannot re-render the sky", () => {
    let themeCalls = 0;
    const unsubscribe = subscribeWorldTheme(() => {
      themeCalls += 1;
    });

    setHoveredStation("work");
    setExplore(true);

    unsubscribe();
    expect(themeCalls).toBe(0);
  });
});

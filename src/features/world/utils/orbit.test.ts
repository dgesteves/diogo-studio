import { describe, expect, it } from "vitest";
import { ORBIT } from "../constants/orbit";
import { clampAzimuth, clampPolar, clampZoom, damp, isOrbitIdle } from "./orbit";

describe("orbit clamps", () => {
  it("bounds azimuth and polar symmetrically", () => {
    expect(clampAzimuth(99)).toBe(ORBIT.azimuthLimitRad);
    expect(clampAzimuth(-99)).toBe(-ORBIT.azimuthLimitRad);
    expect(clampPolar(99)).toBe(ORBIT.polarLimitRad);
    expect(clampPolar(-99)).toBe(-ORBIT.polarLimitRad);
  });

  it("bounds zoom between the configured factors", () => {
    expect(clampZoom(0)).toBe(ORBIT.zoomMinFactor);
    expect(clampZoom(99)).toBe(ORBIT.zoomMaxFactor);
    expect(clampZoom(1)).toBe(1);
  });
});

describe("isOrbitIdle", () => {
  it("is idle only after the return delay and while not dragging", () => {
    const now = 10_000;
    expect(isOrbitIdle(now, now - ORBIT.returnDelayMs - 1, false)).toBe(true);
    expect(isOrbitIdle(now, now - 1, false)).toBe(false);
    expect(isOrbitIdle(now, 0, true)).toBe(false);
  });
});

describe("damp", () => {
  it("holds when delta is zero and converges toward the goal", () => {
    expect(damp(0, 1, 10, 0)).toBe(0);
    const step = damp(0, 1, 10, 0.016);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(1);
    expect(damp(0, 1, 10, 100)).toBeCloseTo(1, 5);
  });
});

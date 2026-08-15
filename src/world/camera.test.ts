import { describe, expect, it } from "vitest";
import { ROOM } from "@/world/room";
import {
  clampCameraX,
  framingPullback,
  ORBIT,
  clampAzimuth,
  clampPolar,
  clampZoom,
  damp,
  isOrbitIdle,
} from "./camera";

describe("framingPullback", () => {
  it("keeps the authored framing at or above the reference aspect", () => {
    expect(framingPullback(16 / 9)).toBe(1);
    expect(framingPullback(21 / 9)).toBe(1);
    expect(framingPullback(3)).toBe(1);
  });

  it("pulls the camera back as the viewport gets narrower", () => {
    expect(framingPullback(16 / 10)).toBeGreaterThan(1);
    expect(framingPullback(4 / 3)).toBeGreaterThan(framingPullback(16 / 10));
    expect(framingPullback(9 / 16)).toBeGreaterThan(framingPullback(4 / 3));
  });

  it("caps the pullback on extreme portrait ratios", () => {
    expect(framingPullback(0.05)).toBeLessThanOrEqual(3.5);
    expect(framingPullback(9 / 21)).toBeGreaterThan(1);
  });

  it("falls back to no pullback for invalid aspect values", () => {
    expect(framingPullback(0)).toBe(1);
    expect(framingPullback(-2)).toBe(1);
    expect(framingPullback(Number.NaN)).toBe(1);
    expect(framingPullback(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("clampCameraX", () => {
  it("leaves the authored framing untouched", () => {
    expect(clampCameraX(4.4)).toBe(4.4);
    expect(clampCameraX(0)).toBe(0);
  });

  it("keeps a pulled-back camera clear of both side walls", () => {
    expect(clampCameraX(20)).toBeLessThan(ROOM.maxX);
    expect(clampCameraX(20)).toBeGreaterThan(ROOM.maxX - 1);
    expect(clampCameraX(-20)).toBeGreaterThan(ROOM.minX);
    expect(clampCameraX(-20)).toBeLessThan(ROOM.minX + 1);
  });
});

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

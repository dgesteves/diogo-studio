import { describe, expect, it } from "vitest";
import { ROOM } from "@/constants/room";
import { clampCameraX, framingPullback } from "./framing";

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

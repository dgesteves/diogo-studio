import { describe, expect, it } from "vitest";
import { EXPLORE } from "../constants/explore";
import { clampPitch, clampToBounds, derivePitch, deriveYaw, moveVector } from "./explore";

describe("clampPitch", () => {
  it("bounds pitch within the configured range", () => {
    expect(clampPitch(99)).toBe(EXPLORE.pitchMaxRad);
    expect(clampPitch(-99)).toBe(EXPLORE.pitchMinRad);
    expect(clampPitch(0)).toBe(0);
  });
});

describe("clampToBounds", () => {
  it("clamps x and z into the room AABB", () => {
    const { minX, maxX, minZ, maxZ } = EXPLORE.bounds;
    expect(clampToBounds(-999, 999)).toEqual([minX, maxZ]);
    expect(clampToBounds(999, -999)).toEqual([maxX, minZ]);
  });
});

describe("moveVector", () => {
  it("maps forward and strafe to view-relative XZ at yaw 0", () => {
    const [fx, fz] = moveVector(0, 1, 0);
    expect(fx).toBeCloseTo(0, 5);
    expect(fz).toBeCloseTo(-1, 5);
    const [sx, sz] = moveVector(0, 0, 1);
    expect(sx).toBeCloseTo(1, 5);
    expect(sz).toBeCloseTo(0, 5);
    const [ix, iz] = moveVector(0, 0, 0);
    expect(ix).toBeCloseTo(0, 5);
    expect(iz).toBeCloseTo(0, 5);
  });

  it("never exceeds unit length on diagonals", () => {
    const [x, z] = moveVector(0, 1, 1);
    expect(Math.hypot(x, z)).toBeCloseTo(1, 5);
  });
});

describe("deriveYaw / derivePitch", () => {
  it("round-trips a normalized look direction", () => {
    const yaw = 0.7;
    const pitch = -0.3;
    const dirX = -Math.sin(yaw) * Math.cos(pitch);
    const dirY = Math.sin(pitch);
    const dirZ = -Math.cos(yaw) * Math.cos(pitch);
    expect(deriveYaw(dirX, dirZ)).toBeCloseTo(yaw, 5);
    expect(derivePitch(dirY)).toBeCloseTo(pitch, 5);
  });
});

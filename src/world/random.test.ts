import { describe, expect, it } from "vitest";
import { mulberry32 } from "./random";

function take(seed: number, count: number): number[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => rand());
}

describe("mulberry32", () => {
  it("is reproducible for a given seed", () => {
    expect(take(1, 8)).toEqual(take(1, 8));
    expect(take(0, 8)).toEqual(take(0, 8));
    expect(take(-7, 8)).toEqual(take(-7, 8));
  });

  it("produces a different stream per seed", () => {
    expect(take(1, 8)).not.toEqual(take(2, 8));
  });

  it("stays in [0, 1)", () => {
    for (const seed of [0, 1, 42, 2 ** 31, -1]) {
      for (const value of take(seed, 64)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    }
  });

  it("advances rather than repeating a value", () => {
    const values = take(99, 32);
    expect(new Set(values).size).toBe(values.length);
  });
});

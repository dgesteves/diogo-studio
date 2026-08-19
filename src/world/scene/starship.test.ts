import { describe, expect, it } from "vitest";

import {
  BOOSTER_MODEL_HEIGHT,
  FLAPS,
  GRID_FINS,
  SHIP_MODEL_HEIGHT,
  STACK_HEIGHT,
} from "./starship";
import { BOOSTER_OFFSET_X, clearanceAbove, SHIP_OFFSET_X, WALL_SHELVES } from "./shelving";

/**
 * The two rocket models on the bottom shelf. They are authored in meters of the real vehicle
 * and scaled once, so what is worth checking is the shape rather than any rendered size: a
 * flap detached from the hull, a fin on the wrong stage, or a model too tall for the spot it
 * stands on are all silent — the mesh renders, in the wrong place, and nothing throws.
 */

const HULL_RADIUS = 4.5;
const BOOSTER_HEIGHT = 71;
const SHIP_HEIGHT = 52;

describe("the Starship models", () => {
  it("keeps the real stack's proportions", () => {
    // 123 m of vehicle, a little under 60% of it booster. Both are public numbers.
    expect(STACK_HEIGHT).toBe(123);
    expect(BOOSTER_HEIGHT / STACK_HEIGHT).toBeCloseTo(0.577, 2);
  });

  /** Three, since the current booster dropped the fourth. */
  it("carries three grid fins, evenly spaced around the booster", () => {
    expect(GRID_FINS).toHaveLength(3);

    const angles = GRID_FINS.map((fin) => Math.atan2(fin.position[0], fin.position[2]));
    const spacings = angles
      .slice(1)
      .map((angle, index) => Math.abs(angle - angles[index]!))
      .map((gap) => Math.min(gap, 2 * Math.PI - gap));

    for (const spacing of spacings) expect.soft(spacing).toBeCloseTo((2 * Math.PI) / 3, 5);
  });

  it("stows every fin and flap against the hull rather than floating it off", () => {
    for (const fin of [...GRID_FINS, ...FLAPS]) {
      const axial = Math.hypot(fin.position[0], fin.position[2]);
      const inner = fin.reach - fin.args[0];
      expect.soft(inner, `${fin.key} floats off the hull`).toBeLessThan(HULL_RADIUS);
      expect.soft(axial, `${fin.key} is sunk inside the hull`).toBeGreaterThan(HULL_RADIUS / 2);
    }
  });

  /** Each stage measures from its own base now that they stand apart, not from the pad. */
  it("keeps every fin and flap within the stage it belongs to", () => {
    for (const fin of GRID_FINS) {
      expect.soft(fin.y, `${fin.key} is off the booster`).toBeGreaterThan(0);
      expect.soft(fin.y, `${fin.key} is off the booster`).toBeLessThan(BOOSTER_HEIGHT);
    }
    for (const flap of FLAPS) {
      expect.soft(flap.y, `${flap.key} is off the ship`).toBeGreaterThan(0);
      expect.soft(flap.y, `${flap.key} is past the nose`).toBeLessThan(SHIP_HEIGHT);
    }
  });

  /** Aft flaps are the big pair, and putting them above the forward pair inverts the ship. */
  it("hangs the large flaps below the small ones", () => {
    const aft = FLAPS.filter((flap) => flap.key.startsWith("aft"));
    const forward = FLAPS.filter((flap) => flap.key.startsWith("forward"));

    expect(aft).toHaveLength(2);
    expect(forward).toHaveLength(2);
    expect(Math.max(...aft.map((flap) => flap.y))).toBeLessThan(
      Math.min(...forward.map((flap) => flap.y)),
    );
    expect(aft[0]!.args[1]).toBeGreaterThan(forward[0]!.args[1]);
  });

  /**
   * Both models are nearly twice the height of the books beside them, and what gives them the
   * room is standing where nothing hangs over them. Slide either left, under the middle plank,
   * and the nose goes through that plank with nothing to say so.
   */
  it("fits both models under whatever hangs over the spots they stand on", () => {
    const shelf = WALL_SHELVES.find((candidate) => candidate.key === "bottom");

    expect(shelf).toBeDefined();
    expect(BOOSTER_MODEL_HEIGHT).toBeLessThanOrEqual(clearanceAbove(shelf!, BOOSTER_OFFSET_X));
    expect(SHIP_MODEL_HEIGHT).toBeLessThanOrEqual(clearanceAbove(shelf!, SHIP_OFFSET_X));
  });

  /**
   * Unstacking them is only worth anything if they stay one set: two models scaled to the same
   * height would put a 52 m ship and a 71 m booster nose to nose, which is a toy shelf rather
   * than a scale pair.
   */
  it("builds both stages at one scale, so the ship stands shorter", () => {
    expect(SHIP_MODEL_HEIGHT).toBeLessThan(BOOSTER_MODEL_HEIGHT);
    expect(SHIP_MODEL_HEIGHT / BOOSTER_MODEL_HEIGHT).toBeCloseTo((1.6 + 52) / (1.6 + 71), 4);
  });
});

import { describe, expect, it } from "vitest";

import { SABER_TIP, VADER_MODEL_HEIGHT } from "./vader";
import { clearanceAbove, VADER_OFFSET_X, WALL_SHELVES } from "./shelving";

/**
 * The figure on the top shelf. Its body is a stack of boxes whose proportions no test can
 * usefully argue with, but the two things it does to the shelf around it can both be wrong in
 * silence: a blade angled a little steeper ends inside the plank, and one a little longer ends
 * off the side of it. Neither throws, and at fifteen pixels neither is obvious.
 */

const shelf = WALL_SHELVES.find((candidate) => candidate.key === "top");

describe("the figure on the top shelf", () => {
  it("stands under the band the sign leaves", () => {
    expect(shelf).toBeDefined();
    expect(VADER_MODEL_HEIGHT).toBeLessThanOrEqual(clearanceAbove(shelf!, VADER_OFFSET_X));
  });

  it("holds the blade clear of the plank it stands on", () => {
    expect(SABER_TIP[1]).toBeGreaterThan(0);
    // Held out and down, not tucked in: a tip above the hand is the pose upside down.
    expect(SABER_TIP[1]).toBeLessThan(VADER_MODEL_HEIGHT / 2);
    expect(SABER_TIP[0]).toBeLessThan(0);
  });

  it("keeps the whole pose on the plank", () => {
    const half = shelf!.width / 2;

    expect(Math.abs(VADER_OFFSET_X + SABER_TIP[0])).toBeLessThan(half);
    expect(Math.abs(VADER_OFFSET_X)).toBeLessThan(half);
  });
});

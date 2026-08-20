import { describe, expect, it } from "vitest";

import { createRecordingContext } from "@tests/recording-ctx";
import { worldPalettes } from "../materials";
import { MUG_PRINT, MUG_QUOTE, paintMugPrint, quoteSize } from "./mug";

/**
 * The quote wrapped around the mug. None of what can go wrong with it throws: type set
 * wider than the panel that faces the camera runs around the side of the mug and out of
 * sight, a trail whose stride does not divide the circumference is cut in half at the seam,
 * and a glaze the room swallows is the bug this print was added to fix. All three are read
 * off the transcript instead.
 */

const print = () => {
  const recording = createRecordingContext(MUG_PRINT);
  paintMugPrint(recording.ctx);
  return recording;
};

/** WCAG relative luminance, which is what "does this get lost in the room" comes down to. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const [r, g, b] = linear as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [dark, light] = [luminance(a), luminance(b)].sort((x, y) => x - y) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

describe("the mug's print", () => {
  it("prints the whole quote, in order and in capitals", () => {
    expect(print().text).toEqual(MUG_QUOTE.map((line) => line.toUpperCase()));
  });

  it("sets every line inside the third of the circumference that faces the camera", () => {
    const { runs } = print();
    const panel = MUG_PRINT.width * 0.42;

    for (const run of runs) {
      expect.soft(run.align).toBe("center");
      expect.soft(run.x).toBe(MUG_PRINT.width / 2);
      expect.soft(run.width).toBeLessThanOrEqual(panel);
    }
  });

  it("keeps the type between the two rules rather than over them", () => {
    const { runs } = print();
    const size = quoteSize(createRecordingContext(MUG_PRINT).ctx, MUG_QUOTE);

    for (const run of runs) {
      expect.soft(run.y - size / 2).toBeGreaterThan(MUG_PRINT.height * 0.2);
      expect.soft(run.y + size / 2).toBeLessThan(MUG_PRINT.height * 0.72);
    }
  });

  /**
   * The canvas's two vertical edges are the same line on the mug. A stride that does not
   * divide the width leaves a short step there, which is the one flaw in a wrapped print
   * that is visible from across the room.
   */
  it("walks the trail across the seam in whole strides", () => {
    const feet = print()
      .callsTo("ellipse")
      .map(([x]) => Number(x));
    const stride = MUG_PRINT.width / 14;

    // Two ovals a footprint, and none of them within half a stride of the seam.
    expect(feet).toHaveLength(28);
    for (const x of feet) {
      expect.soft(x).toBeGreaterThan(0);
      expect.soft(x).toBeLessThan(MUG_PRINT.width);
    }
    expect(Math.min(...feet)).toBeGreaterThan(stride * 0.25);
    expect(MUG_PRINT.width - Math.max(...feet)).toBeGreaterThan(stride * 0.25);
  });

  it("paints nothing outside the canvas it wraps", () => {
    const { paths } = print();

    for (const path of paths) {
      for (const [x, y] of path.points) {
        expect.soft(x).toBeGreaterThanOrEqual(0);
        expect.soft(x).toBeLessThanOrEqual(MUG_PRINT.width);
        expect.soft(y).toBeGreaterThanOrEqual(0);
        expect.soft(y).toBeLessThanOrEqual(MUG_PRINT.height);
      }
    }
  });

  /**
   * The mug is the `/now` station's object and it used to be a dark cylinder on a dark desk.
   * The glaze is the fix, so it is held to a ratio: legible type on it, and a body that
   * separates from the room behind it at more than a WCAG AA margin.
   */
  it("is glazed light enough to be found, and printed dark enough to be read", () => {
    const { valuesOf } = print();
    const [glaze, amber] = valuesOf("fillStyle") as [string, string];
    const ink = valuesOf("fillStyle").at(-1) as string;

    expect(contrast(glaze, ink)).toBeGreaterThan(7);
    expect(contrast(glaze, amber)).toBeGreaterThan(2);
    expect(contrast(glaze, worldPalettes.night.background)).toBeGreaterThan(10);
  });

  it("scales the quote down rather than off the mug when it grows", () => {
    const ctx = createRecordingContext(MUG_PRINT).ctx;

    expect(quoteSize(ctx, ["Every journey"])).toBeGreaterThan(
      quoteSize(ctx, ["Every journey to the sea"]),
    );
  });
});

import { describe, expect, it } from "vitest";
import { formatCount, formatVital, fpsTone } from "./panels";

/**
 * The overlay's job is to be readable at a glance, which is entirely a question of units
 * and thresholds. Asserted at the module path because that is where the boundaries live —
 * 999 ms against 1000, 54 fps against 55 — and the rendered panel shows one value at a time.
 * `inspector.dom.test.tsx` covers what reaches the screen.
 */

describe("formatVital", () => {
  it("reports CLS as the unitless ratio it is", () => {
    // Three decimals, because the "good" threshold is 0.1 and rounding to milliseconds
    // would render every score as 0.
    expect(formatVital("CLS", 0.0824)).toBe("0.082");
    expect(formatVital("CLS", 0)).toBe("0.000");
  });

  it("reports sub-second timings in whole milliseconds", () => {
    expect(formatVital("LCP", 842.6)).toBe("843ms");
    expect(formatVital("INP", 999.4)).toBe("999ms");
  });

  it("switches to seconds at a second", () => {
    expect(formatVital("LCP", 1000)).toBe("1.00s");
    expect(formatVital("TTFB", 2517)).toBe("2.52s");
  });
});

describe("fpsTone", () => {
  it.each([
    [120, "text-signal-good"],
    [55, "text-signal-good"],
    [54, "text-signal-warn"],
    [30, "text-signal-warn"],
    [29, "text-signal-hot"],
    [0, "text-signal-hot"],
  ])("tones %i fps as %s", (fps, tone) => {
    // 55 is "the display's refresh rate, near enough"; 30 is where the world stops feeling
    // continuous. Both are inclusive, and the boundary is the whole point of the function.
    expect(fpsTone(fps)).toBe(tone);
  });
});

describe("formatCount", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1000, "1.0k"],
    [12_500, "12.5k"],
    [999_999, "1000.0k"],
    [1_000_000, "1.0M"],
    [1_250_000, "1.3M"],
  ])("abbreviates %i as %s", (count, formatted) => {
    expect(formatCount(count)).toBe(formatted);
  });
});

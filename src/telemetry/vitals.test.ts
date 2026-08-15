import { describe, expect, it } from "vitest";
import { DEFAULT_TRACES_SAMPLE_RATE } from "./vitals";

/**
 * The fallback Sentry trace sample rate, used by `instrumentation.ts` and
 * `instrumentation-client.ts` whenever the environment does not set one. Those two files run
 * outside `src/` and outside the test environment, so this is the only place the value is
 * checkable at all.
 *
 * Asserted as a range rather than as an equality, deliberately: `toBe(0.1)` would restate the
 * line it is testing and fail every time someone tunes the rate. What must not change is that it
 * stays a usable fraction — `0` silently turns tracing off everywhere, and a value above `1` is
 * not a rate Sentry accepts.
 */

describe("DEFAULT_TRACES_SAMPLE_RATE", () => {
  it("is a sampling fraction that actually samples", () => {
    expect(DEFAULT_TRACES_SAMPLE_RATE).toBeGreaterThan(0);
    expect(DEFAULT_TRACES_SAMPLE_RATE).toBeLessThanOrEqual(1);
  });

  it("survives the string round-trip its consumers put it through", () => {
    // Both call sites do `Number(process.env.X ?? DEFAULT)`, so a value that does not survive
    // `Number()` would reach Sentry as `NaN` and disable tracing without an error.
    expect(Number(String(DEFAULT_TRACES_SAMPLE_RATE))).toBe(DEFAULT_TRACES_SAMPLE_RATE);
  });
});

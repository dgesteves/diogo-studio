import { describe, expect, it, vi } from "vitest";
import type { VitalName, VitalRating } from "./telemetry";
import { getVitalsServerSnapshot, getVitalsSnapshot, subscribeVitals } from "./telemetry";

// The three fields the store reads off a `Metric`. Declaring the shape the *store* needs,
// rather than casting a partial object to the library's union, is what keeps this spec
// honest: a fourth field would have to be added here before it could be asserted.
type VitalReport = { name: VitalName; value: number; rating: VitalRating };

// `web-vitals` reports from real browser performance entries, which jsdom does not
// produce, so the library is the mock boundary: the spec captures the callbacks the store
// registers and reports through them. That is exactly what the inspector overlay depends
// on — a metric arriving late, after subscription, and reaching the snapshot.
const registry = vi.hoisted(() => ({
  handlers: new Map<VitalName, (metric: VitalReport) => void>(),
  registrations: 0,
  allChanges: new Set<VitalName>(),
}));

vi.mock("web-vitals", () => {
  function capture(name: VitalName) {
    return (callback: (metric: VitalReport) => void, opts?: { reportAllChanges?: boolean }) => {
      registry.handlers.set(name, callback);
      registry.registrations += 1;
      if (opts?.reportAllChanges) registry.allChanges.add(name);
    };
  }
  return {
    onLCP: capture("LCP"),
    onINP: capture("INP"),
    onCLS: capture("CLS"),
    onTTFB: capture("TTFB"),
    onFCP: capture("FCP"),
  };
});

function report(name: VitalName, value: number, rating: VitalRating): void {
  const handler = registry.handlers.get(name);
  if (!handler) throw new Error(`web-vitals never registered a handler for ${name}`);
  handler({ name, value, rating });
}

async function subscribeAndStart(onChange: () => void = () => {}): Promise<() => void> {
  const unsubscribe = subscribeVitals(onChange);
  await vi.waitFor(() => expect(registry.handlers.size).toBe(5));
  return unsubscribe;
}

// `ensureStarted` registers through a dynamic import, so a second registration lands a
// tick later than the subscribe that caused it. Asserting the count synchronously cannot
// see a missing guard — verified by mutation.
async function settleImports(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("the Web Vitals store", () => {
  it("starts collection once, however many components subscribe", async () => {
    const first = await subscribeAndStart();
    const second = subscribeVitals(() => {});
    await settleImports();

    // Registering LCP twice would double-count every metric in the overlay.
    expect(registry.registrations).toBe(5);
    expect(registry.allChanges).toEqual(new Set(["INP", "CLS"]));

    first();
    second();
  });

  it("records each metric under its own name and notifies subscribers", async () => {
    let calls = 0;
    const unsubscribe = await subscribeAndStart(() => {
      calls += 1;
    });

    report("LCP", 1234.5, "good");
    report("CLS", 0.24, "needs-improvement");

    expect(getVitalsSnapshot()).toEqual({
      LCP: { value: 1234.5, rating: "good" },
      CLS: { value: 0.24, rating: "needs-improvement" },
    });
    expect(calls).toBe(2);

    // CLS and INP report all changes, so a later sample must replace the earlier one
    // rather than accumulate.
    report("CLS", 0.31, "poor");
    expect(getVitalsSnapshot().CLS).toEqual({ value: 0.31, rating: "poor" });

    unsubscribe();
    report("FCP", 900, "good");
    expect(calls).toBe(3);
  });

  it("reports no measurements on the server", () => {
    expect(getVitalsServerSnapshot()).toEqual({});
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPerfSnapshot,
  getPerfServerSnapshot,
  markPerfInactive,
  publishPerf,
  subscribePerf,
} from "./perf-store";

// `publishPerf` timestamps every sample, and the inspector renders staleness from it.
const T0 = new Date("2026-01-01T00:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
  markPerfInactive();
});

describe("perf-store", () => {
  it("merges a partial sample, activates and timestamps it", () => {
    publishPerf({ fps: 60, drawCalls: 120 });

    expect(getPerfSnapshot()).toMatchObject({
      active: true,
      fps: 60,
      drawCalls: 120,
      triangles: 0,
      updatedAt: T0.getTime(),
    });

    vi.setSystemTime(new Date(T0.getTime() + 1000));
    publishPerf({ fps: 58 });

    // A renderer sample carries only the fields it measured; the rest must survive.
    expect(getPerfSnapshot()).toMatchObject({
      fps: 58,
      drawCalls: 120,
      updatedAt: T0.getTime() + 1000,
    });
  });

  it("goes inactive once, so a torn-down canvas cannot spam subscribers", () => {
    let calls = 0;
    const unsubscribe = subscribePerf(() => {
      calls += 1;
    });

    publishPerf({ fps: 60 });
    markPerfInactive();
    markPerfInactive();

    expect(getPerfSnapshot().active).toBe(false);
    expect(getPerfSnapshot().fps).toBe(60);
    expect(calls).toBe(2);

    unsubscribe();
    publishPerf({ fps: 30 });
    expect(calls).toBe(2);
  });

  it("reports an inert snapshot on the server", () => {
    publishPerf({ fps: 60, triangles: 1000 });

    expect(getPerfServerSnapshot()).toMatchObject({
      active: false,
      fps: 0,
      triangles: 0,
      updatedAt: 0,
    });
  });
});

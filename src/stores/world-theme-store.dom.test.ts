import { describe, expect, it } from "vitest";
import {
  getWorldModeServerSnapshot,
  getWorldModeSnapshot,
  setWorldMode,
  subscribeWorldTheme,
} from "./world-theme-store";

describe("world-theme-store", () => {
  it("starts at night and switches on demand", () => {
    expect(getWorldModeSnapshot()).toBe("night");

    setWorldMode("day");
    expect(getWorldModeSnapshot()).toBe("day");

    setWorldMode("night");
    expect(getWorldModeSnapshot()).toBe("night");
  });

  it("notifies subscribers only when the mode actually changes", () => {
    let calls = 0;
    const unsubscribe = subscribeWorldTheme(() => {
      calls += 1;
    });

    setWorldMode("day");
    setWorldMode("day");
    setWorldMode("night");

    unsubscribe();
    setWorldMode("day");

    expect(calls).toBe(2);
  });

  it("renders night on the server, so the first paint matches the default", () => {
    setWorldMode("day");

    expect(getWorldModeServerSnapshot()).toBe("night");
  });
});

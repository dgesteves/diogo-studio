import { afterEach, describe, expect, it } from "vitest";
import { getExploreSnapshot, setExplore, subscribeExplore, toggleExplore } from "./explore-store";

afterEach(() => {
  setExplore(false);
});

describe("explore-store", () => {
  it("toggles and reflects the active flag", () => {
    expect(getExploreSnapshot()).toBe(false);
    toggleExplore();
    expect(getExploreSnapshot()).toBe(true);
    toggleExplore();
    expect(getExploreSnapshot()).toBe(false);
  });

  it("notifies subscribers only on change", () => {
    let calls = 0;
    const unsubscribe = subscribeExplore(() => {
      calls += 1;
    });
    setExplore(true);
    setExplore(true);
    setExplore(false);
    unsubscribe();
    expect(calls).toBe(2);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import {
  getBootSnapshot,
  hasBootedThisSession,
  markBootedThisSession,
  markWorldReady,
  resetBoot,
  setBootProgress,
} from "./boot-store";

afterEach(() => {
  resetBoot();
  window.sessionStorage.clear();
});

describe("boot-store progress", () => {
  it("clamps and rounds reported progress", () => {
    setBootProgress(-10);
    expect(getBootSnapshot().progress).toBe(0);

    setBootProgress(150);
    expect(getBootSnapshot().progress).toBe(100);

    setBootProgress(42.6);
    expect(getBootSnapshot().progress).toBe(43);
  });

  it("marks the world ready once", () => {
    expect(getBootSnapshot().ready).toBe(false);
    markWorldReady();
    expect(getBootSnapshot().ready).toBe(true);
  });
});

describe("boot-store session gate", () => {
  it("tracks the once-per-session flag", () => {
    expect(hasBootedThisSession()).toBe(false);
    markBootedThisSession();
    expect(hasBootedThisSession()).toBe(true);
  });
});

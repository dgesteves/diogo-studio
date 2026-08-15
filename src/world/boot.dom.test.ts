import { describe, expect, it, vi } from "vitest";
import {
  BOOT_SESSION_KEY,
  BOOT_SPLASH_ID,
  getBootServerSnapshot,
  getBootSnapshot,
  hasBootedThisSession,
  hideBootSplash,
  markBootedThisSession,
  markWorldReady,
  setBootProgress,
  subscribeBoot,
} from "./boot";

describe("boot progress", () => {
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

  it("notifies subscribers only when the signal changes", () => {
    let calls = 0;
    const unsubscribe = subscribeBoot(() => {
      calls += 1;
    });

    // The loader reports progress on every frame, so re-emitting a rounded value that has
    // not moved would re-render the splash dozens of times per percent.
    setBootProgress(40);
    setBootProgress(40.2);
    markWorldReady();
    markWorldReady();

    unsubscribe();
    setBootProgress(80);

    expect(calls).toBe(2);
  });

  it("reports an unstarted boot on the server", () => {
    setBootProgress(60);
    markWorldReady();

    expect(getBootServerSnapshot()).toEqual({ progress: 0, ready: false });
  });
});

describe("boot session gate", () => {
  it("tracks the once-per-session flag", () => {
    expect(hasBootedThisSession()).toBe(false);
    markBootedThisSession();
    expect(hasBootedThisSession()).toBe(true);
  });

  it("treats unavailable storage as a first visit instead of throwing", () => {
    const denied = new Error("The operation is insecure.");
    // Spy on the prototype, not on `window.sessionStorage`: jsdom's Storage is a proxy
    // that turns a property definition into a stored *key*, so spying on the instance
    // silently does nothing and leaves this test unable to fail.
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw denied;
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw denied;
    });

    // Safari in private mode throws on both. Gating twice is a nuisance; a thrown error
    // during the boot gate would leave the visitor with no world at all.
    expect(() => markBootedThisSession()).not.toThrow();
    expect(hasBootedThisSession()).toBe(false);

    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe("boot splash handoff", () => {
  it("hides the server-rendered splash, and tolerates its absence", () => {
    // The splash is markup in the document head's layout, not React's — the store is what
    // hands over to the client boot sequence.
    const splash = document.createElement("div");
    splash.id = BOOT_SPLASH_ID;
    document.body.append(splash);

    hideBootSplash();
    expect(splash.style.display).toBe("none");

    splash.remove();
    expect(() => hideBootSplash()).not.toThrow();
  });

  it("keys the session flag and the splash element to stable ids", () => {
    // Both values are duplicated where TypeScript cannot see them: `#boot-splash` styles
    // the pre-hydration splash in `styles/globals.css`, and `studio-booted` is written by
    // hand in `tests/e2e/fixtures.ts` to simulate a returning visitor. Renaming either
    // constant silently breaks that copy, so pin them.
    expect(BOOT_SESSION_KEY).toBe("studio-booted");
    expect(BOOT_SPLASH_ID).toBe("boot-splash");
  });
});

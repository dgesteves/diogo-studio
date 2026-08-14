import type * as ReducedMotionStore from "./reduced-motion-store";
import { afterEach, describe, expect, it, vi } from "vitest";
import { restoreMediaStubs, stubMatchMedia, stubNetworkConnection } from "@tests/media";
import {
  getLowPowerServerSnapshot,
  getLowPowerSnapshot,
  getOverrideServerSnapshot,
  getOverrideSnapshot,
  getSystemServerSnapshot,
  getSystemSnapshot,
  persistOverride,
  subscribeLowPower,
  subscribeOverride,
  subscribeSystem,
} from "./reduced-motion-store";

/**
 * This spec and `providers/providers.dom.test.tsx` are the only two that stub `matchMedia`
 * and `navigator.connection` directly — every other spec reaches reduced motion through
 * `persistOverride`, per `.claude/rules/testing.md`. The three sources are independent and
 * `reduced-motion-provider` combines them (`override ?? (system || lowPower)`), so each is
 * asserted here on its own and the precedence is asserted there.
 */

const STORAGE_KEY = "diogo-studio.reduced-motion";

async function freshStore(): Promise<typeof ReducedMotionStore> {
  // The override cache hydrates from localStorage exactly once per module instance, and
  // `resetStores()` has already hydrated the shared one by the time any test runs.
  vi.resetModules();
  return import("./reduced-motion-store");
}

afterEach(restoreMediaStubs);

describe("reduced-motion-store: the system preference", () => {
  it("reads the media query and reports its changes", () => {
    const media = stubMatchMedia(true);
    expect(getSystemSnapshot()).toBe(true);

    let calls = 0;
    const unsubscribe = subscribeSystem(() => {
      calls += 1;
    });
    media.change(false);

    expect(calls).toBe(1);
    expect(getSystemSnapshot()).toBe(false);

    unsubscribe();
    expect(media.listeners).toBe(0);
    media.change(true);
    expect(calls).toBe(1);
  });

  it("assumes motion is allowed on the server", () => {
    expect(getSystemServerSnapshot()).toBe(false);
  });
});

describe("reduced-motion-store: the low-power heuristic", () => {
  it("treats Save-Data and 2G as low power, and faster connections as not", () => {
    stubNetworkConnection({ saveData: true, effectiveType: "4g" });
    expect(getLowPowerSnapshot()).toBe(true);

    stubNetworkConnection({ saveData: false, effectiveType: "slow-2g" });
    expect(getLowPowerSnapshot()).toBe(true);

    stubNetworkConnection({ saveData: false, effectiveType: "2g" });
    expect(getLowPowerSnapshot()).toBe(true);

    stubNetworkConnection({ saveData: false, effectiveType: "3g" });
    expect(getLowPowerSnapshot()).toBe(false);
  });

  it("reports not-low-power where the Network Information API is missing", () => {
    // Safari and Firefox never expose `navigator.connection`; the world must not degrade
    // itself there.
    expect(getLowPowerSnapshot()).toBe(false);
    expect(subscribeLowPower(() => {})()).toBeUndefined();
    expect(getLowPowerServerSnapshot()).toBe(false);
  });

  it("subscribes to connection changes only where the API supports it", () => {
    // A holder object, not a `let`: TypeScript narrows a variable only assigned inside a
    // callback to `null`, which makes the call below unreachable to it.
    const conn: { listener: (() => void) | null } = { listener: null };
    stubNetworkConnection({
      effectiveType: "4g",
      addEventListener: (_type: "change", cb: () => void) => {
        conn.listener = cb;
      },
      removeEventListener: () => {
        conn.listener = null;
      },
    });

    let calls = 0;
    const unsubscribe = subscribeLowPower(() => {
      calls += 1;
    });
    conn.listener?.();
    expect(calls).toBe(1);

    // Tearing down the subscription matters here: a connection change firing into an
    // unmounted provider is a React warning at best.
    unsubscribe();
    expect(conn.listener).toBeNull();
  });
});

describe("reduced-motion-store: the visitor's own override", () => {
  it("persists a choice, notifies subscribers and clears back to no preference", () => {
    let calls = 0;
    const unsubscribe = subscribeOverride(() => {
      calls += 1;
    });

    persistOverride(true);
    expect(getOverrideSnapshot()).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

    persistOverride(false);
    expect(getOverrideSnapshot()).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");

    persistOverride(null);
    expect(getOverrideSnapshot()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    expect(calls).toBe(3);
    unsubscribe();
    persistOverride(true);
    expect(calls).toBe(3);
  });

  it("hydrates a stored choice on first read, and ignores anything else", async () => {
    for (const [stored, expected] of [
      ["true", true],
      ["false", false],
      ["yes", null],
    ] as const) {
      window.localStorage.setItem(STORAGE_KEY, stored);
      const store = await freshStore();
      expect(store.getOverrideSnapshot()).toBe(expected);
    }
  });

  it("survives storage a browser refuses to give it", async () => {
    const denied = new Error("The operation is insecure.");
    // Storage.prototype, not `window.localStorage`: jsdom's Storage is a proxy that turns
    // a property definition into a stored *key*, so an instance spy does nothing at all
    // and this test would pass against a store with no error handling.
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw denied;
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw denied;
    });

    const store = await freshStore();
    expect(store.getOverrideSnapshot()).toBeNull();

    // Private-mode Safari throws on write. The choice must still apply for this session.
    let calls = 0;
    const unsubscribe = store.subscribeOverride(() => {
      calls += 1;
    });
    expect(() => store.persistOverride(true)).not.toThrow();
    expect(store.getOverrideSnapshot()).toBe(true);
    expect(calls).toBe(1);

    unsubscribe();
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("reports no override on the server, so the markup matches the system default", () => {
    expect(getOverrideServerSnapshot()).toBeNull();
  });
});

import type * as ReducedMotion from "./reduced-motion";
import type { ReactElement, ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { click } from "@tests/interactions";
import { restoreMediaStubs, stubMatchMedia, stubNetworkConnection } from "@tests/media";
import {
  getLowPowerServerSnapshot,
  getLowPowerSnapshot,
  getOverrideServerSnapshot,
  getOverrideSnapshot,
  getSystemServerSnapshot,
  getSystemSnapshot,
  persistOverride,
  ReducedMotionProvider,
  subscribeLowPower,
  subscribeOverride,
  subscribeSystem,
  useReducedMotionPreference,
} from "./reduced-motion";

/**
 * `reducedMotion` decides whether this site animates at all, and `AGENTS.md` makes reduced
 * motion a real path rather than a degraded one. It is derived from three independent sources —
 * the OS media query, a low-power connection, and the visitor's own toggle — so each is
 * asserted on its own below, and then the precedence between them.
 *
 * This spec and `providers/providers.dom.test.tsx` are the only two that stub `matchMedia` and
 * `navigator.connection` directly; every other spec reaches reduced motion through
 * `persistOverride`, per `.claude/rules/testing.md`.
 *
 * The provider used to also configure Motion and Lenis. Both were deleted in the refactor's
 * first phase: `MotionConfig` configured a library with no animated components, and Lenis
 * substituted a permanent rAF loop for the native `scroll-behavior: smooth` it disabled. What
 * consumes the preference now is the world (which does not mount at all under reduced motion,
 * asserted in `world-stage.dom.test.tsx` and `reduced-motion.spec.ts`) and the CSS media query
 * in `globals.css`.
 */

const STORAGE_KEY = "diogo-studio.reduced-motion";

async function freshModule(): Promise<typeof ReducedMotion> {
  // The override reads storage once, when the module initializes, and `resetStores()` has
  // already loaded the shared instance by the time any test here runs.
  vi.resetModules();
  return import("./reduced-motion");
}

function Preference(): ReactElement {
  const { reducedMotion, systemReducedMotion, lowPower, override, setOverride } =
    useReducedMotionPreference();
  return (
    <>
      <dl>
        <dt>reducedMotion</dt>
        <dd data-testid="reduced-motion">{String(reducedMotion)}</dd>
        <dt>system</dt>
        <dd data-testid="system">{String(systemReducedMotion)}</dd>
        <dt>lowPower</dt>
        <dd data-testid="low-power">{String(lowPower)}</dd>
        <dt>override</dt>
        <dd data-testid="override">{String(override)}</dd>
      </dl>
      {/* The HUD's motion toggle writes through the context, never the store directly. */}
      <button type="button" onClick={() => setOverride(true)}>
        Reduce motion
      </button>
      <button type="button" onClick={() => setOverride(null)}>
        Follow the system
      </button>
    </>
  );
}

function withPreference(children: ReactNode): ReactElement {
  return <ReducedMotionProvider>{children}</ReducedMotionProvider>;
}

function read(testId: string): string {
  return screen.getByTestId(testId).textContent ?? "";
}

afterEach(restoreMediaStubs);

describe("the system preference", () => {
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

describe("the low-power heuristic", () => {
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

describe("the visitor's own override", () => {
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

  it("hydrates a stored choice when the module loads, and ignores anything else", async () => {
    for (const [stored, expected] of [
      ["true", true],
      ["false", false],
      ["yes", null],
    ] as const) {
      window.localStorage.setItem(STORAGE_KEY, stored);
      const fresh = await freshModule();
      expect(fresh.getOverrideSnapshot()).toBe(expected);
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

    const fresh = await freshModule();
    expect(fresh.getOverrideSnapshot()).toBeNull();

    // Private-mode Safari throws on write. The choice must still apply for this session.
    let calls = 0;
    const unsubscribe = fresh.subscribeOverride(() => {
      calls += 1;
    });
    expect(() => fresh.persistOverride(true)).not.toThrow();
    expect(fresh.getOverrideSnapshot()).toBe(true);
    expect(calls).toBe(1);

    unsubscribe();
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("reports no override on the server, so the markup matches the system default", () => {
    persistOverride(true);

    expect(getOverrideServerSnapshot()).toBeNull();
  });
});

describe("ReducedMotionProvider", () => {
  it("respects motion by default, when nothing asks for less", () => {
    render(withPreference(<Preference />));

    expect(read("reduced-motion")).toBe("false");
    expect(read("system")).toBe("false");
    expect(read("low-power")).toBe("false");
    expect(read("override")).toBe("null");
  });

  it("follows the system preference, including a change made while the tab is open", () => {
    const media = stubMatchMedia(true);
    render(withPreference(<Preference />));

    expect(read("system")).toBe("true");
    expect(read("reduced-motion")).toBe("true");

    act(() => media.change(false));
    expect(read("reduced-motion")).toBe("false");
  });

  it("reduces motion on a low-power connection", () => {
    stubNetworkConnection({ saveData: true });
    render(withPreference(<Preference />));

    // Save-Data is a request to spend less, and this world's animation budget is GPU time
    // and battery — so the low-power signal has to reach `reducedMotion`, not just report
    // itself.
    expect(read("low-power")).toBe("true");
    expect(read("reduced-motion")).toBe("true");
  });

  it("lets the visitor's own choice win in both directions", () => {
    stubMatchMedia(true);
    render(withPreference(<Preference />));

    // `override ?? (system || lowPower)`: an explicit "animate" must beat the OS, or the
    // world's motion toggle would be a control with no effect.
    act(() => persistOverride(false));
    expect(read("override")).toBe("false");
    expect(read("reduced-motion")).toBe("false");

    act(() => persistOverride(true));
    expect(read("reduced-motion")).toBe("true");

    // Clearing hands the decision back to the system.
    act(() => persistOverride(null));
    expect(read("override")).toBe("null");
    expect(read("reduced-motion")).toBe("true");
  });

  it("persists a choice made through the context, not just through the store", async () => {
    const user = userEvent.setup();
    render(withPreference(<Preference />));

    await click(user, /reduce motion/i);
    expect(read("reduced-motion")).toBe("true");
    // Persisted, so the choice survives a reload rather than only this render.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

    await click(user, /follow the system/i);
    expect(read("override")).toBe("null");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("falls back to full motion outside the provider instead of throwing", () => {
    // Several components read this hook and are also rendered inside the scene, where the
    // provider is not always an ancestor. Throwing there would take down the canvas.
    render(<Preference />);

    expect(read("reduced-motion")).toBe("false");
    expect(read("override")).toBe("null");
  });
});

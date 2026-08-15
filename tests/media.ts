import { vi } from "vitest";

/**
 * The two platform signals behind `reduced-motion`. `vitest.setup.ts` stubs
 * `matchMedia` as "no preference" for every jsdom spec, and specs that just need reduced
 * motion should set the app's own override instead of touching either of these — see
 * `.claude/rules/testing.md`. These helpers exist for the two specs that own the seams
 * themselves: the store's, and the provider's precedence rules, which cannot be asserted
 * without a system preference that says "reduce".
 */

type MediaListener = () => void;

export type MediaQueryStub = {
  /** Flips the query and notifies every current listener, like a real OS change. */
  change: (matches: boolean) => void;
  /** Live listener count, so a spec can assert the store unsubscribes. */
  readonly listeners: number;
};

export function stubMatchMedia(matches: boolean): MediaQueryStub {
  const listeners = new Set<MediaListener>();
  const state = { matches };

  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return state.matches;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: "change", listener: MediaListener) => void listeners.add(listener),
    removeEventListener: (_type: "change", listener: MediaListener) =>
      void listeners.delete(listener),
    // next-themes still subscribes through the pre-2018 API, and omitting these two
    // throws "o.addListener is not a function" the moment ThemeProvider mounts.
    addListener: (listener: MediaListener) => void listeners.add(listener),
    removeListener: (listener: MediaListener) => void listeners.delete(listener),
    dispatchEvent: () => false,
  }));

  return {
    change: (next: boolean) => {
      state.matches = next;
      for (const listener of listeners) listener();
    },
    get listeners() {
      return listeners.size;
    },
  };
}

export type ConnectionStub = {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

/** Adds the Network Information API that only Chromium exposes. */
export function stubNetworkConnection(connection: ConnectionStub): void {
  Object.defineProperty(window.navigator, "connection", {
    value: connection,
    configurable: true,
  });
}

/**
 * Restores what `vitest.setup.ts` provides. Not `vi.unstubAllGlobals()`: that drops the
 * setup file's `matchMedia` stub too, leaving later specs in the same file without one.
 */
export function restoreMediaStubs(): void {
  Reflect.deleteProperty(window.navigator, "connection");
  stubMatchMedia(false);
}

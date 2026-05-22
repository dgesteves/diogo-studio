"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

/* ---------------------------------------------------------------------------
 * Public types
 * ------------------------------------------------------------------------- */

type ReducedMotionContextValue = {
  /**
   * The single, app-wide answer: should this surface reduce motion?
   *
   * True if ANY of the following hold:
   * - User override is `true`.
   * - OS-level `prefers-reduced-motion: reduce` is on.
   * - Device reports a low-power signal (Save-Data or 2G/slow-2G connection).
   *
   * Override `false` takes precedence over both system signals.
   */
  reducedMotion: boolean;
  /** OS-level `prefers-reduced-motion: reduce`. */
  systemReducedMotion: boolean;
  /** Save-Data or slow connection signal. */
  lowPower: boolean;
  /** Manual override. `null` means "follow the signals above". */
  override: boolean | null;
  setOverride: (value: boolean | null) => void;
};

const ReducedMotionContext = createContext<ReducedMotionContextValue | null>(null);

const STORAGE_KEY = "diogo-studio.reduced-motion";

/* ---------------------------------------------------------------------------
 * Minimal typings for the Network Information API
 * (Not in TS DOM lib by default; we treat it as best-effort.)
 * ------------------------------------------------------------------------- */

type NetworkConnection = {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

function getConnection(): NetworkConnection | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & { connection?: NetworkConnection };
  return nav.connection ?? null;
}

/* ---------------------------------------------------------------------------
 * System reduced-motion store
 * ------------------------------------------------------------------------- */

function subscribeSystem(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSystemSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getSystemServerSnapshot(): boolean {
  return false;
}

/* ---------------------------------------------------------------------------
 * Low-power store (Save-Data / effective-type)
 * ------------------------------------------------------------------------- */

function subscribeLowPower(callback: () => void): () => void {
  const conn = getConnection();
  if (!conn?.addEventListener) return () => {};
  conn.addEventListener("change", callback);
  return () => conn.removeEventListener?.("change", callback);
}

function getLowPowerSnapshot(): boolean {
  const conn = getConnection();
  if (!conn) return false;
  if (conn.saveData === true) return true;
  if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return true;
  return false;
}

function getLowPowerServerSnapshot(): boolean {
  return false;
}

/* ---------------------------------------------------------------------------
 * User override store — module-level so updates fan out to every subscriber
 * in the same tab. (We deliberately don't react to cross-tab `storage`
 * events; the UX value is low and it keeps the implementation small.)
 * ------------------------------------------------------------------------- */

const overrideListeners = new Set<() => void>();
let overrideCache: boolean | null = null;
let overrideHydrated = false;

function hydrateOverride(): void {
  if (overrideHydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    overrideCache = raw === "true" ? true : raw === "false" ? false : null;
  } catch {
    overrideCache = null;
  }
  overrideHydrated = true;
}

function subscribeOverride(callback: () => void): () => void {
  overrideListeners.add(callback);
  return () => {
    overrideListeners.delete(callback);
  };
}

function getOverrideSnapshot(): boolean | null {
  hydrateOverride();
  return overrideCache;
}

function getOverrideServerSnapshot(): boolean | null {
  return null;
}

function persistOverride(value: boolean | null): void {
  overrideCache = value;
  overrideHydrated = true;
  if (typeof window !== "undefined") {
    try {
      if (value === null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
    } catch {
      // Storage may be blocked (incognito, sandboxed). Best-effort.
    }
  }
  overrideListeners.forEach((listener) => listener());
}

/* ---------------------------------------------------------------------------
 * Provider + hook
 * ------------------------------------------------------------------------- */

/**
 * App-wide motion-preference source of truth.
 *
 * Three signals fold into one boolean (`reducedMotion`):
 * - System `prefers-reduced-motion`.
 * - Low-power (Save-Data, slow-2g, 2g).
 * - User override (persisted in localStorage).
 *
 * Every animation/3D surface gates on this before kicking off motion.
 */
export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  const systemReducedMotion = useSyncExternalStore(
    subscribeSystem,
    getSystemSnapshot,
    getSystemServerSnapshot,
  );

  const lowPower = useSyncExternalStore(
    subscribeLowPower,
    getLowPowerSnapshot,
    getLowPowerServerSnapshot,
  );

  const override = useSyncExternalStore(
    subscribeOverride,
    getOverrideSnapshot,
    getOverrideServerSnapshot,
  );

  const setOverride = useCallback((value: boolean | null) => {
    persistOverride(value);
  }, []);

  const value = useMemo<ReducedMotionContextValue>(
    () => ({
      // Override wins; otherwise OR the system signals.
      reducedMotion: override ?? (systemReducedMotion || lowPower),
      systemReducedMotion,
      lowPower,
      override,
      setOverride,
    }),
    [override, systemReducedMotion, lowPower, setOverride],
  );

  return <ReducedMotionContext.Provider value={value}>{children}</ReducedMotionContext.Provider>;
}

/** Hook for components that need to gate animation/3D work. */
export function useReducedMotionPreference(): ReducedMotionContextValue {
  const ctx = useContext(ReducedMotionContext);
  if (!ctx) {
    // Fallback for tests / Storybook contexts that don't wrap with the provider.
    return {
      reducedMotion: false,
      systemReducedMotion: false,
      lowPower: false,
      override: null,
      setOverride: () => {},
    };
  }
  return ctx;
}

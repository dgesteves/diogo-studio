"use client";

import { createContext, useContext, useSyncExternalStore, type ReactElement } from "react";
import { createStore } from "@/store";

/**
 * The motion preference, and the three independent sources it is derived from: the OS media
 * query, a low-power connection, and the visitor's own toggle. Provider and stores are one
 * module because they are one concept — a consumer that reads the sources without applying
 * `override ?? (system || lowPower)` would be reading a different preference.
 */

const STORAGE_KEY = "diogo-studio.reduced-motion";

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

export function subscribeSystem(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function getSystemSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getSystemServerSnapshot(): boolean {
  return false;
}

export function subscribeLowPower(callback: () => void): () => void {
  const conn = getConnection();
  if (!conn?.addEventListener) return () => {};
  conn.addEventListener("change", callback);
  return () => conn.removeEventListener?.("change", callback);
}

export function getLowPowerSnapshot(): boolean {
  const conn = getConnection();
  if (!conn) return false;
  if (conn.saveData === true) return true;
  if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return true;
  return false;
}

export function getLowPowerServerSnapshot(): boolean {
  return false;
}

/**
 * `null` is the initial value rather than what storage holds, so the server snapshot stays
 * "no preference expressed" — the markup React hydrates against cannot know this browser.
 * Reading storage at module scope instead of on first snapshot keeps the write out of a
 * render pass, where notifying subscribers would be a React warning.
 */
const override = createStore<boolean | null>(null);

function readStoredOverride(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "true" ? true : raw === "false" ? false : null;
  } catch {
    return null;
  }
}

override.set(readStoredOverride());

export const subscribeOverride = override.subscribe;
export const getOverrideSnapshot = override.get;
export const getOverrideServerSnapshot = override.getServer;

export function persistOverride(value: boolean | null): void {
  override.set(value);
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    /* storage unavailable — the choice still applies for this session */
  }
}

type ReducedMotionContextValue = {
  reducedMotion: boolean;
  systemReducedMotion: boolean;
  lowPower: boolean;
  override: boolean | null;
  setOverride: (value: boolean | null) => void;
};

const ReducedMotionContext = createContext<ReducedMotionContextValue | null>(null);

export function ReducedMotionProvider({ children }: { children: React.ReactNode }): ReactElement {
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

  const value = useSyncExternalStore(
    subscribeOverride,
    getOverrideSnapshot,
    getOverrideServerSnapshot,
  );

  const context: ReducedMotionContextValue = {
    reducedMotion: value ?? (systemReducedMotion || lowPower),
    systemReducedMotion,
    lowPower,
    override: value,
    setOverride: persistOverride,
  };

  return <ReducedMotionContext.Provider value={context}>{children}</ReducedMotionContext.Provider>;
}

export function useReducedMotionPreference(): ReducedMotionContextValue {
  const ctx = useContext(ReducedMotionContext);
  if (!ctx) {
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

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

export function subscribeOverride(callback: () => void): () => void {
  overrideListeners.add(callback);
  return () => {
    overrideListeners.delete(callback);
  };
}

export function getOverrideSnapshot(): boolean | null {
  hydrateOverride();
  return overrideCache;
}

export function getOverrideServerSnapshot(): boolean | null {
  return null;
}

export function persistOverride(value: boolean | null): void {
  overrideCache = value;
  overrideHydrated = true;
  if (typeof window !== "undefined") {
    try {
      if (value === null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
    } catch {
      void 0;
    }
  }
  overrideListeners.forEach((listener) => listener());
}

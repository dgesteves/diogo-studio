export type BootSignal = { progress: number; ready: boolean };

export const BOOT_SESSION_KEY = "studio-booted";
export const BOOT_SPLASH_ID = "boot-splash";
const INITIAL: BootSignal = { progress: 0, ready: false };

let signal: BootSignal = INITIAL;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function setBootProgress(progress: number): void {
  const next = Math.max(0, Math.min(100, Math.round(progress)));
  if (next === signal.progress) return;
  signal = { ...signal, progress: next };
  emit();
}

export function markWorldReady(): void {
  if (signal.ready) return;
  signal = { ...signal, ready: true };
  emit();
}

export function resetBoot(): void {
  signal = INITIAL;
  emit();
}

export function subscribeBoot(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getBootSnapshot(): BootSignal {
  return signal;
}

export function getBootServerSnapshot(): BootSignal {
  return INITIAL;
}

export function hasBootedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(BOOT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markBootedThisSession(): void {
  try {
    window.sessionStorage.setItem(BOOT_SESSION_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

export function hideBootSplash(): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(BOOT_SPLASH_ID);
  if (el) el.style.display = "none";
}

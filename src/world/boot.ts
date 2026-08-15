import { createStore } from "@/store";

/**
 * The boot handoff: how far the world has loaded, whether it is ready, whether this visitor
 * has already sat through it once, and the server-rendered splash that has to disappear when
 * the client sequence takes over.
 *
 * Separate from `store.ts` because it is a different lifecycle — it runs once, at startup,
 * and nothing reads it afterwards.
 */

export type BootSignal = { progress: number; ready: boolean };

export const BOOT_SESSION_KEY = "studio-booted";
export const BOOT_SPLASH_ID = "boot-splash";

const boot = createStore<BootSignal>({ progress: 0, ready: false });

export function setBootProgress(progress: number): void {
  const next = Math.max(0, Math.min(100, Math.round(progress)));
  boot.update((prev) => (prev.progress === next ? prev : { ...prev, progress: next }));
}

export function markWorldReady(): void {
  boot.update((prev) => (prev.ready ? prev : { ...prev, ready: true }));
}

export function resetBoot(): void {
  boot.set(boot.getServer());
}

export const subscribeBoot = boot.subscribe;
export const getBootSnapshot = boot.get;
export const getBootServerSnapshot = boot.getServer;

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

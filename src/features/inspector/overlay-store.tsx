"use client";

import { useEffect, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { createStore } from "@/store";

const STORAGE_KEY = "studio-inspector-open";

/**
 * Whether the Web-Vitals overlay is showing. Persisted for the session so a reload does not
 * close it mid-measurement, and read at module scope rather than on first snapshot: restoring
 * it during a render pass would notify subscribers while React is rendering.
 */
const overlay = createStore(false);

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

overlay.set(readStored());

function persist(open: boolean): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    /* storage unavailable — the overlay still opens for this session */
  }
}

export function setInspectorOpen(next: boolean): void {
  // Guarded here as well as in the store, because the write to storage is the part that has
  // to not happen on a no-op.
  if (overlay.get() === next) return;
  overlay.set(next);
  persist(next);
}

export function toggleInspector(): void {
  setInspectorOpen(!overlay.get());
}

type InspectorOverlayValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
};

export function useInspectorOverlay(): InspectorOverlayValue {
  const open = useSyncExternalStore(overlay.subscribe, overlay.get, overlay.getServer);
  return { open, setOpen: setInspectorOpen, toggle: toggleInspector };
}

export function InspectorOverlayProvider({ children }: { children: ReactNode }): ReactElement {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "`" && event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        toggleInspector();
      } else if (event.key === "Escape" && overlay.get()) {
        setInspectorOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return <>{children}</>;
}

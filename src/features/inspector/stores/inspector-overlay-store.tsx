"use client";

import { useEffect, useSyncExternalStore, type ReactElement, type ReactNode } from "react";

const STORAGE_KEY = "studio-inspector-open";

function readStored(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persist(open: boolean): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

let isOpen = false;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  isOpen = readStored();
}

function subscribe(callback: () => void): () => void {
  hydrate();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): boolean {
  hydrate();
  return isOpen;
}

function getServerSnapshot(): boolean {
  return false;
}

export function setInspectorOpen(next: boolean): void {
  hydrated = true;
  if (isOpen === next) return;
  isOpen = next;
  persist(next);
  for (const listener of listeners) listener();
}

export function toggleInspector(): void {
  setInspectorOpen(!isOpen);
}

type InspectorOverlayValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
};

export function useInspectorOverlay(): InspectorOverlayValue {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { open, setOpen: setInspectorOpen, toggle: toggleInspector };
}

export function InspectorOverlayProvider({ children }: { children: ReactNode }): ReactElement {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "`" && event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        toggleInspector();
      } else if (event.key === "Escape" && isOpen) {
        setInspectorOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return <>{children}</>;
}

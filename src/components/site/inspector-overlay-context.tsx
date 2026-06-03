"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Owns the open/closed state of the Inspector Overlay (S4 — the "receipts"
 * HUD) and binds its keyboard shortcut once at the app root.
 *
 * Toggle: `Ctrl` + `` ` `` (backtick). Cmd+backtick is a macOS window
 * shortcut, so we deliberately bind Ctrl only — it's free in the browser on
 * every platform. `Escape` closes. Off by default; nothing renders until the
 * visitor opts in (or the /colophon page calls `toggle()`).
 */

type InspectorOverlayContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
};

const InspectorOverlayContext = createContext<InspectorOverlayContextValue | null>(null);

export function InspectorOverlayProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(false);
  const openRef = useRef(false);

  const setOpen = useCallback((next: boolean) => {
    openRef.current = next;
    setOpenState(next);
  }, []);

  const toggle = useCallback(() => setOpen(!openRef.current), [setOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "`" && event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setOpen(!openRef.current);
      } else if (event.key === "Escape" && openRef.current) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const value = useMemo<InspectorOverlayContextValue>(
    () => ({ open, setOpen, toggle }),
    [open, setOpen, toggle],
  );

  return (
    <InspectorOverlayContext.Provider value={value}>{children}</InspectorOverlayContext.Provider>
  );
}

export function useInspectorOverlay(): InspectorOverlayContextValue {
  const ctx = useContext(InspectorOverlayContext);
  if (!ctx) {
    throw new Error("useInspectorOverlay must be used within <InspectorOverlayProvider>.");
  }
  return ctx;
}

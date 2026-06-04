"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactElement } from "react";

type InspectorOverlayContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
};

const InspectorOverlayContext = createContext<InspectorOverlayContextValue | null>(null);

export function InspectorOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  const [open, setOpenState] = useState(false);
  const openRef = useRef(false);

  function setOpen(next: boolean): void {
    openRef.current = next;
    setOpenState(next);
  }

  function toggle(): void {
    setOpen(!openRef.current);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "`" && event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        const next = !openRef.current;
        openRef.current = next;
        setOpenState(next);
      } else if (event.key === "Escape" && openRef.current) {
        openRef.current = false;
        setOpenState(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value: InspectorOverlayContextValue = { open, setOpen, toggle };

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

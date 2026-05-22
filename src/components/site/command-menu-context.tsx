"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type CommandMenuContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

/**
 * Owns the open/closed state of the global ⌘K Command Menu and binds the
 * keyboard shortcut once at the app root. Any component can open the palette
 * via `useCommandMenu()`.
 */
export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKeyDown(event: KeyboardEvent) {
      const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isModK) return;
      // Don't fight the browser's own ⌘K in inputs unless we're already open.
      event.preventDefault();
      setOpen((value) => !value);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<CommandMenuContextValue>(() => ({ open, setOpen, toggle }), [open, toggle]);

  return <CommandMenuContext.Provider value={value}>{children}</CommandMenuContext.Provider>;
}

export function useCommandMenu(): CommandMenuContextValue {
  const ctx = useContext(CommandMenuContext);
  if (!ctx) {
    throw new Error("useCommandMenu must be used within <CommandMenuProvider>.");
  }
  return ctx;
}

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

export type CommandMenuMode = "navigate" | "ask";

type CommandMenuContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
  /** Mode to render when the menu is open. Resets to "navigate" on close. */
  mode: CommandMenuMode;
  setMode: (value: CommandMenuMode) => void;
  /** One-shot: open the menu in a specific mode. */
  openWithMode: (value: CommandMenuMode) => void;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

/**
 * Owns the open/closed state and current mode of the global ⌘K Command
 * Menu, plus binds the keyboard shortcut once at the app root. Any
 * component can open the palette (and route it to Navigate or Ask) via
 * `useCommandMenu()`.
 *
 * The mode-reset-on-close invariant is enforced at the single source of
 * truth (the `setOpen` wrapper), not via a reactive effect — see
 * `react-you-might-not-need-an-effect`. The ⌘K keyboard handler routes
 * through the wrapper via a ref so it sees the live `open` value without
 * re-binding the listener on every render.
 */
export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [mode, setMode] = useState<CommandMenuMode>("navigate");
  const openRef = useRef(false);

  const setOpen = useCallback((next: boolean) => {
    openRef.current = next;
    setOpenState(next);
    // Closing always returns Navigate to the next ⌘K opener. Ask mode is
    // opt-in via `openWithMode` or the in-dialog tab switch.
    if (!next) setMode("navigate");
  }, []);

  const toggle = useCallback(() => {
    setOpen(!openRef.current);
  }, [setOpen]);

  const openWithMode = useCallback(
    (next: CommandMenuMode) => {
      setMode(next);
      setOpen(true);
    },
    [setOpen],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKeyDown(event: KeyboardEvent) {
      const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isModK) return;
      // Don't fight the browser's own ⌘K in inputs unless we're already open.
      event.preventDefault();
      setOpen(!openRef.current);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const value = useMemo<CommandMenuContextValue>(
    () => ({ open, setOpen, toggle, mode, setMode, openWithMode }),
    [open, setOpen, toggle, mode, openWithMode],
  );

  return <CommandMenuContext.Provider value={value}>{children}</CommandMenuContext.Provider>;
}

export function useCommandMenu(): CommandMenuContextValue {
  const ctx = useContext(CommandMenuContext);
  if (!ctx) {
    throw new Error("useCommandMenu must be used within <CommandMenuProvider>.");
  }
  return ctx;
}

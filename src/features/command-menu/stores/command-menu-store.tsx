"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
} from "react";

export type CommandMenuMode = "navigate" | "ask";

type CommandMenuContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
  mode: CommandMenuMode;
  setMode: (value: CommandMenuMode) => void;
  openWithMode: (value: CommandMenuMode) => void;

  /**
   * Whatever had focus when the menu was opened, so it can be given focus back on
   * close. Captured here rather than in the dialog because this is the only place that
   * sees every entry point — the deck button, the home CTA, `openWithMode`, and ⌘K —
   * and the only point early enough: once the dialog mounts it has already moved focus
   * to its own input. `command-menu.tsx` consumes it in `onCloseAutoFocus`.
   */
  openerRef: RefObject<HTMLElement | null>;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

export function CommandMenuProvider({ children }: { children: React.ReactNode }): ReactElement {
  const [open, setOpenState] = useState(false);
  const [mode, setMode] = useState<CommandMenuMode>("navigate");
  const openRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);

  function setOpen(next: boolean): void {
    if (next && !openRef.current) {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    }
    openRef.current = next;
    setOpenState(next);
    if (!next) setMode("navigate");
  }

  function toggle(): void {
    setOpen(!openRef.current);
  }

  function openWithMode(next: CommandMenuMode): void {
    setMode(next);
    setOpen(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isModK) return;
      event.preventDefault();
      // Was a copy of `setOpen`'s body. Calling it instead is what guarantees the
      // shortcut path also remembers the opener — and one open path cannot drift from
      // the other. Safe from the empty dependency list: the closure only touches refs
      // and `useState` setters, all of which are stable for the component's lifetime.
      setOpen(!openRef.current);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value: CommandMenuContextValue = {
    open,
    setOpen,
    toggle,
    mode,
    setMode,
    openWithMode,
    openerRef,
  };

  return <CommandMenuContext.Provider value={value}>{children}</CommandMenuContext.Provider>;
}

export function useCommandMenu(): CommandMenuContextValue {
  const ctx = useContext(CommandMenuContext);
  if (!ctx) {
    throw new Error("useCommandMenu must be used within <CommandMenuProvider>.");
  }
  return ctx;
}

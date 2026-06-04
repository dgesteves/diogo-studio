"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactElement } from "react";

export type CommandMenuMode = "navigate" | "ask";

type CommandMenuContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
  mode: CommandMenuMode;
  setMode: (value: CommandMenuMode) => void;
  openWithMode: (value: CommandMenuMode) => void;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

export function CommandMenuProvider({ children }: { children: React.ReactNode }): ReactElement {
  const [open, setOpenState] = useState(false);
  const [mode, setMode] = useState<CommandMenuMode>("navigate");
  const openRef = useRef(false);

  function setOpen(next: boolean): void {
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
    if (typeof window === "undefined") return;
    function onKeyDown(event: KeyboardEvent) {
      const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isModK) return;
      event.preventDefault();
      const next = !openRef.current;
      openRef.current = next;
      setOpenState(next);
      if (!next) setMode("navigate");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value: CommandMenuContextValue = { open, setOpen, toggle, mode, setMode, openWithMode };

  return <CommandMenuContext.Provider value={value}>{children}</CommandMenuContext.Provider>;
}

export function useCommandMenu(): CommandMenuContextValue {
  const ctx = useContext(CommandMenuContext);
  if (!ctx) {
    throw new Error("useCommandMenu must be used within <CommandMenuProvider>.");
  }
  return ctx;
}

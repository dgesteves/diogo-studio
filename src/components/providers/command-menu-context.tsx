"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";

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

  const setOpen = useCallback((next: boolean) => {
    openRef.current = next;
    setOpenState(next);
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

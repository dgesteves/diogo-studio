"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { useReducedMotionPreference } from "@/components/providers/reduced-motion-provider";
import { useCommandMenu } from "@/components/providers/command-menu-context";
import { cn } from "@/lib/utils/cn";

import { CommandMenuAsk } from "./command-menu-ask";
import { Footer } from "./command-menu-footer";
import { NavigateView } from "./command-menu-navigate";

export function CommandMenu(): ReactElement {
  const { open, setOpen, mode, setMode } = useCommandMenu();
  const { reducedMotion } = useReducedMotionPreference();
  const [openTick, setOpenTick] = useState(0);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) setOpenTick((n) => n + 1);
      setOpen(next);
    },
    [setOpen],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "1") {
        e.preventDefault();
        setMode("navigate");
      } else if (e.key === "2") {
        e.preventDefault();
        setMode("ask");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setMode]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "bg-background/70 fixed inset-0 z-50 backdrop-blur-sm",
            !reducedMotion &&
              "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out",
          )}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "border-border-strong bg-surface fixed top-[18%] left-1/2 z-50 flex w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-lg border shadow-2xl shadow-black/20",
            !reducedMotion &&
              "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
          )}
        >
          <VisuallyHidden>
            <Dialog.Title>
              {mode === "ask" ? "Ask the Inspector agent" : "Command menu"}
            </Dialog.Title>
          </VisuallyHidden>

          {mode === "navigate" ? (
            <NavigateView onClose={close} />
          ) : (
            <CommandMenuAsk onNavigate={close} openTick={openTick} />
          )}

          <Footer mode={mode} setMode={setMode} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

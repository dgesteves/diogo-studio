"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect, type ReactElement } from "react";

import { useReducedMotionPreference } from "@/providers/reduced-motion-provider";
import { useCommandMenu } from "../stores/command-menu-store";
import { cn } from "@/utils/cn";

import { CommandMenuAsk } from "./command-menu-ask";
import { Footer } from "./command-menu-footer";
import { NavigateView } from "./command-menu-navigate";

export function CommandMenu(): ReactElement {
  const { open, setOpen, mode, setMode, openerRef } = useCommandMenu();
  const { reducedMotion } = useReducedMotionPreference();

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

  function close(): void {
    setOpen(false);
  }

  // Radix's modal content prevents FocusScope's own restore and focuses `Dialog.Trigger`
  // instead — and this menu has no trigger, because it opens from the deck, the home CTA
  // and ⌘K alike. So closing it dropped focus on `<body>`, stranding a keyboard visitor
  // at the top of the document. The store remembers the opener at the moment of the
  // action, which is the only point early enough: by `onOpenAutoFocus` the menu has
  // already focused its own input. Preventing the default here skips Radix's
  // null-trigger handler, so this focus call is the last one to run.
  function restoreOpenerFocus(event: Event): void {
    const opener = openerRef.current;
    if (!opener?.isConnected) return;
    event.preventDefault();
    opener.focus();
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
          onCloseAutoFocus={restoreOpenerFocus}
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
            <CommandMenuAsk onNavigate={close} />
          )}

          <Footer mode={mode} setMode={setMode} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

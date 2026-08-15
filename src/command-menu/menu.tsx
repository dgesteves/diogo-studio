"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Network, Sparkles } from "lucide-react";
import { useEffect, type ReactElement, type ReactNode } from "react";

import { useReducedMotionPreference } from "@/reduced-motion";
import { cn } from "@/utils/cn";

import { CommandMenuAsk } from "./ask";
import { NavigateView } from "./navigate";
import { useCommandMenu, type CommandMenuMode } from "./store";

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

function Footer({
  mode,
  setMode,
}: {
  mode: CommandMenuMode;
  setMode: (m: CommandMenuMode) => void;
}): ReactElement {
  return (
    <div className="border-border bg-surface-muted/40 text-subtle-foreground flex items-center justify-between border-t px-3 py-2 font-mono text-[10px] tracking-wider uppercase">
      <div
        role="tablist"
        aria-label="Command menu mode"
        className="border-border bg-surface flex items-center rounded-md border p-0.5"
      >
        <ModeTab
          active={mode === "navigate"}
          onClick={() => setMode("navigate")}
          shortcut="1"
          icon={<Sparkles className="size-3" aria-hidden="true" />}
          label="Navigate"
        />
        <ModeTab
          active={mode === "ask"}
          onClick={() => setMode("ask")}
          shortcut="2"
          icon={<Network className="size-3" aria-hidden="true" />}
          label="Ask"
        />
      </div>
      <span className="hidden sm:inline" aria-hidden="true">
        ⌘1 / ⌘2 to switch
      </span>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  shortcut,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  shortcut: string;
  icon: ReactNode;
  label: string;
}): ReactElement {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-1.5 rounded px-2 py-1 text-[10px] tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "border-border ml-1 hidden rounded border px-1 sm:inline",
          active ? "border-background/40 text-background/80" : "text-muted-foreground",
        )}
        aria-hidden="true"
      >
        ⌘{shortcut}
      </span>
    </button>
  );
}

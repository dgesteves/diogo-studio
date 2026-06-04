"use client";

import { Network, Sparkles } from "lucide-react";
import { type ReactElement, type ReactNode } from "react";

import { type CommandMenuMode } from "../stores/command-menu-store";
import { cn } from "@/lib/utils/cn";

export function Footer({
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

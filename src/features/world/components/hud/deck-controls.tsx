"use client";

import type { ReactElement } from "react";
import { Activity, MoonStar, Search, Sparkles, Sun, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "next-themes";
import { Kbd } from "@/components/ui/kbd";
import { useAudio } from "@/features/audio";
import { useCommandMenu } from "@/features/command-menu";
import { useInspectorOverlay } from "@/features/inspector";
import { useIsClient } from "@/hooks/use-is-client";
import { DeckButton } from "./deck-button";

export function DeckControls(): ReactElement {
  const { setOpen, openWithMode } = useCommandMenu();
  const { enabled: soundOn, toggle: toggleSound } = useAudio();
  const { resolvedTheme, setTheme } = useTheme();
  const { open: inspectorOpen, toggle: toggleInspector } = useInspectorOverlay();
  const isClient = useIsClient();
  const isDark = isClient && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
        className="group border-border bg-surface-inset/70 text-muted-foreground hover:border-border-strong hover:text-foreground focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-lg border px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Search className="size-3.5" aria-hidden="true" />
        <span className="hidden lg:inline">Search</span>
        <span className="ml-0.5 hidden items-center gap-1 lg:inline-flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <DeckButton onClick={() => openWithMode("ask")} aria-label="Ask the studio agent">
        <Sparkles aria-hidden="true" />
      </DeckButton>

      <span className="bg-border/70 mx-0.5 h-5 w-px" aria-hidden="true" />

      <DeckButton
        onClick={toggleSound}
        active={soundOn}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Mute ambient studio audio" : "Play ambient studio audio"}
      >
        {soundOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
      </DeckButton>

      <DeckButton
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isClient ? (
          isDark ? (
            <Sun aria-hidden="true" />
          ) : (
            <MoonStar aria-hidden="true" />
          )
        ) : (
          <span className="size-4" aria-hidden="true" />
        )}
      </DeckButton>

      <DeckButton
        onClick={toggleInspector}
        active={inspectorOpen}
        aria-pressed={inspectorOpen}
        aria-label={
          inspectorOpen
            ? "Close the performance inspector overlay"
            : "Open the performance inspector overlay"
        }
      >
        <Activity aria-hidden="true" />
      </DeckButton>
    </div>
  );
}

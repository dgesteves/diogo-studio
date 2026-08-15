"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  type ReactElement,
  useState,
} from "react";
import { cn } from "@/utils/cn";
import { Compass, Activity, MoonStar, Search, Sparkles, Sun, Volume2, VolumeX } from "lucide-react";
import { useReducedMotionPreference } from "@/reduced-motion";
import { toggleExplore } from "../store";
import { useExplore } from "../explore";
import { useTheme } from "next-themes";
import { Kbd } from "@/components/ui/kbd";
import { useAudio } from "../audio";
import { useCommandMenu } from "@/command-menu/store";
import { useInspectorOverlay } from "@/telemetry/store";
import { useIsClient } from "@/hooks/use-is-client";
import { DeckMapOverlay } from "./map";
import { DeckRadar } from "./radar";

/**
 * The command deck along the bottom of the screen — the DOM chrome over the canvas, and the
 * keyboard-reachable path to everything the 3D room offers. It is not decoration: with no
 * canvas at all, this is still how a visitor moves.
 */

type DeckButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
};

const DeckButton = forwardRef<HTMLButtonElement, DeckButtonProps>(
  ({ className, active = false, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-surface-muted focus-visible:ring-ring grid size-9 place-items-center rounded-lg border border-transparent transition-colors focus-visible:ring-2 focus-visible:outline-none [&_svg]:size-4",
        active && "text-accent border-accent/40 bg-accent-soft/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

DeckButton.displayName = "DeckButton";

function DeckExploreToggle(): ReactElement | null {
  const { reducedMotion } = useReducedMotionPreference();
  const active = useExplore();

  if (reducedMotion) return null;

  return (
    <DeckButton
      onClick={toggleExplore}
      active={active}
      aria-pressed={active}
      aria-label={
        active ? "Exit explore mode" : "Explore the studio — move with WASD, press Escape to exit"
      }
    >
      <Compass aria-hidden="true" />
    </DeckButton>
  );
}

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

      <DeckButton
        onClick={toggleSound}
        active={soundOn}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Mute ambient studio audio" : "Play ambient studio audio"}
      >
        {soundOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
      </DeckButton>

      <DeckExploreToggle />

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

export function CommandDeck(): ReactElement {
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
        <div
          data-orbit-ignore=""
          className="deck-shell world-intro-rise border-border/70 bg-background/80 supports-backdrop-filter:bg-background/60 pointer-events-auto relative flex max-w-full items-center gap-1.5 rounded-2xl border p-1.5 shadow-2xl shadow-black/20 backdrop-blur-xl backdrop-saturate-150 sm:gap-2 sm:p-2"
        >
          <DeckRadar mapOpen={mapOpen} onOpenMap={() => setMapOpen(true)} />
          <DeckControls />
        </div>
      </div>
      <DeckMapOverlay open={mapOpen} onOpenChange={setMapOpen} />
    </>
  );
}

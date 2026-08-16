import { type ReactElement, type ReactNode } from "react";
import { AudioProvider, WorldAudio } from "@/world/audio";
import { CommandDeck } from "@/world/hud/deck";
import { ExploreHud } from "@/world/hud/explore";
import { WorldStage } from "@/world/world";
import { BootSequence, BootSplash } from "@/world/boot";

export default function WorldLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <AudioProvider>
      <WorldStage />
      <BootSplash />
      {/*
        `display: contents`, so it changes no layout — it exists only to give the boot
        overlay something of the shell's own to mark. `BootSequence` is a modal, so Radix
        hides the rest of the document through `aria-hidden`'s `hideOthers`, and that walk
        spares every `script` and `[aria-live]` node: `BootSplash`'s inline script and
        `ExploreHud`'s status region both sit inside `<main>`, so it descends past main and
        marks main's children one by one instead of stopping at main. The page segment
        hydrates after the shell, so without this wrapper the mark lands on `PageView`'s
        `<section>` before React has hydrated it, and dev logs a hydration mismatch on
        every first visit. Production does not warn, but the mark is misplaced either way.
        Nothing catches a regression here — `e2e:ci` runs a production build and the
        fixture seeds past the gate — so the wrapper is load-bearing despite looking inert.
      */}
      <div className="contents">{children}</div>
      <ExploreHud />
      <CommandDeck />
      <WorldAudio />
      <BootSequence />
    </AudioProvider>
  );
}

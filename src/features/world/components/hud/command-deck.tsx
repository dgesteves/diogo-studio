"use client";

import { useState, type ReactElement } from "react";
import { DeckControls } from "./deck-controls";
import { DeckMapOverlay } from "./deck-map-overlay";
import { DeckRadar } from "./deck-radar";
import { DeckWaypoints } from "./deck-waypoints";

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
          <span className="bg-border/70 hidden h-8 w-px md:block" aria-hidden="true" />
          <DeckWaypoints />
          <span className="bg-border/70 hidden h-8 w-px md:block" aria-hidden="true" />
          <DeckControls />
        </div>
      </div>
      <DeckMapOverlay open={mapOpen} onOpenChange={setMapOpen} />
    </>
  );
}

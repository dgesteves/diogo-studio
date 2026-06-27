"use client";

import type { ReactElement } from "react";
import { Compass } from "lucide-react";
import { useReducedMotionPreference } from "@/providers/reduced-motion-provider";
import { toggleExplore } from "@/stores/explore-store";
import { useExplore } from "../../hooks/use-explore";
import { DeckButton } from "./deck-button";

export function DeckExploreToggle(): ReactElement | null {
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

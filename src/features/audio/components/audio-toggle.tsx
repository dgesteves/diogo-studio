"use client";

import type { ReactElement } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAudio } from "../audio-provider";

export function AudioToggle(): ReactElement {
  const { enabled, toggle } = useAudio();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute ambient studio audio" : "Play ambient studio audio"}
      className={cn(
        "border-border/70 bg-background/80 text-muted-foreground hover:text-foreground pointer-events-auto fixed bottom-3 left-3 z-40 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[11px] tracking-wide backdrop-blur-xl transition-colors",
        enabled ? "text-accent border-accent/50" : "hover:animate-none motion-safe:animate-pulse",
      )}
    >
      {enabled ? (
        <Volume2 className="size-4" aria-hidden="true" />
      ) : (
        <VolumeX className="size-4" aria-hidden="true" />
      )}
      <span>{enabled ? "Sound on" : "Sound off — click to play"}</span>
    </button>
  );
}

"use client";

import type { ReactElement, RefObject } from "react";
import { Volume2, VolumeX } from "lucide-react";

type BootActionsProps = {
  canEnter: boolean;
  primaryRef: RefObject<HTMLButtonElement | null>;
  onEnterWithSound: () => void;
  onEnterMuted: () => void;
};

export function BootActions({
  canEnter,
  primaryRef,
  onEnterWithSound,
  onEnterMuted,
}: BootActionsProps): ReactElement {
  if (!canEnter) {
    return (
      <button
        type="button"
        onClick={onEnterMuted}
        className="font-mono text-[10px] tracking-widest text-white/40 uppercase underline-offset-4 transition-colors hover:text-white/70 hover:underline"
      >
        Skip intro
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <button
        ref={primaryRef}
        type="button"
        onClick={onEnterWithSound}
        className="inline-flex items-center gap-2 rounded-full border border-[#22d3ee]/50 bg-[#22d3ee]/10 px-5 py-2.5 font-mono text-[11px] tracking-widest text-[#67e8f9] uppercase transition-colors hover:bg-[#22d3ee]/20"
      >
        <Volume2 className="size-4" aria-hidden="true" />
        Enter with sound
      </button>
      <button
        type="button"
        onClick={onEnterMuted}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-mono text-[11px] tracking-widest text-white/70 uppercase transition-colors hover:border-white/35 hover:text-white"
      >
        <VolumeX className="size-4" aria-hidden="true" />
        Enter muted
      </button>
    </div>
  );
}

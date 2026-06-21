"use client";

import { ArrowRight } from "lucide-react";
import { useState, type ReactElement, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { BootSoundToggle } from "./boot-sound-toggle";
import { BootThemeToggle } from "./boot-theme-toggle";

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
  const [soundOn, setSoundOn] = useState(true);

  if (!canEnter) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onEnterMuted}
        className="focus-visible:ring-offset-brand-ink font-mono text-[10px] tracking-widest text-white/45 uppercase hover:bg-white/5 hover:text-white/80"
      >
        Skip intro
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <BootThemeToggle />
        <BootSoundToggle soundOn={soundOn} onChange={setSoundOn} />
      </div>
      <Button
        ref={primaryRef}
        type="button"
        onClick={() => (soundOn ? onEnterWithSound() : onEnterMuted())}
        className="bg-brand-cyan text-brand-ink hover:bg-brand-cyan-bright active:bg-brand-cyan-bright focus-visible:ring-offset-brand-ink h-11 gap-2 px-8 font-mono text-[11px] font-semibold tracking-[0.2em] uppercase shadow-[0_0_28px_var(--brand-cyan)]"
      >
        Enter the studio
        <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  );
}

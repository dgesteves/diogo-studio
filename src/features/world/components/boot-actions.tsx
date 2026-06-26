"use client";

import { ArrowRight } from "lucide-react";
import { useState, type ReactElement, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { useInspectorOverlay } from "@/features/inspector";
import { BootInspectorToggle } from "./boot-inspector-toggle";
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
  const [inspectorOn, setInspectorOn] = useState(true);
  const { setOpen: setInspectorOpen } = useInspectorOverlay();

  function handleEnter(withSound: boolean): void {
    setInspectorOpen(inspectorOn);
    if (withSound) onEnterWithSound();
    else onEnterMuted();
  }

  if (!canEnter) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleEnter(false)}
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
        <BootInspectorToggle inspectorOn={inspectorOn} onChange={setInspectorOn} />
      </div>
      <div className="group relative inline-flex">
        <span
          aria-hidden="true"
          className="boot-cta-frame pointer-events-none absolute -inset-px rounded-sm"
        />
        <Button
          ref={primaryRef}
          type="button"
          onClick={() => handleEnter(soundOn)}
          className="bg-brand-cyan text-brand-ink hover:bg-brand-cyan-bright active:bg-brand-cyan-bright focus-visible:ring-offset-brand-ink relative h-11 gap-2 overflow-hidden rounded-sm px-9 font-mono text-[11px] font-semibold tracking-[0.22em] uppercase shadow-[0_0_30px_var(--brand-cyan)]"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
          />
          <span className="relative z-10 inline-flex items-center gap-2">
            Enter the studio
            <ArrowRight aria-hidden="true" />
          </span>
        </Button>
        <span
          aria-hidden="true"
          className="border-brand-cyan-bright pointer-events-none absolute -top-1 -left-1 size-2.5 border-t-2 border-l-2 transition-all duration-300 group-hover:-top-1.5 group-hover:-left-1.5"
        />
        <span
          aria-hidden="true"
          className="border-brand-cyan-bright pointer-events-none absolute -top-1 -right-1 size-2.5 border-t-2 border-r-2 transition-all duration-300 group-hover:-top-1.5 group-hover:-right-1.5"
        />
        <span
          aria-hidden="true"
          className="border-brand-cyan-bright pointer-events-none absolute -bottom-1 -left-1 size-2.5 border-b-2 border-l-2 transition-all duration-300 group-hover:-bottom-1.5 group-hover:-left-1.5"
        />
        <span
          aria-hidden="true"
          className="border-brand-cyan-bright pointer-events-none absolute -right-1 -bottom-1 size-2.5 border-r-2 border-b-2 transition-all duration-300 group-hover:-right-1.5 group-hover:-bottom-1.5"
        />
      </div>
    </div>
  );
}

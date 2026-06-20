"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils/cn";
import { BOOT_READY_LABEL, BOOT_STEPS } from "../constants/boot";
import { BootActions } from "./boot-actions";

type BootOverlayProps = {
  progress: number;
  canEnter: boolean;
  exiting: boolean;
  onEnterWithSound: () => void;
  onEnterMuted: () => void;
};

export function BootOverlay({
  progress,
  canEnter,
  exiting,
  onEnterWithSound,
  onEnterMuted,
}: BootOverlayProps): ReactElement {
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [faux, setFaux] = useState(8);

  useEffect(() => {
    if (canEnter) return;
    const id = window.setInterval(() => {
      setFaux((value) => (value < 92 ? value + Math.max(0.6, (92 - value) * 0.08) : value));
    }, 180);
    return () => window.clearInterval(id);
  }, [canEnter]);

  useEffect(() => {
    if (canEnter) primaryRef.current?.focus();
  }, [canEnter]);

  const pct = canEnter ? 100 : Math.min(96, Math.max(progress, faux));
  const stepIndex = Math.min(BOOT_STEPS.length - 1, Math.floor((pct / 100) * BOOT_STEPS.length));
  const step = canEnter ? BOOT_READY_LABEL : (BOOT_STEPS[stepIndex] ?? BOOT_STEPS[0]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onEnterMuted()}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center outline-none",
            "bg-[radial-gradient(130%_120%_at_50%_12%,#0c1925_0%,#05080b_64%)]",
            "transition-opacity duration-700 ease-out",
            exiting ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="flex w-full max-w-sm flex-col items-center gap-7">
            <p className="font-mono text-[11px] tracking-[0.42em] text-[#67e8f9]/80 uppercase">
              {siteConfig.name}
            </p>
            <Dialog.Title className="font-mono text-lg font-medium tracking-[0.18em] text-white/95 uppercase">
              Creating the studio
            </Dialog.Title>

            <div className="w-full">
              <div className="h-px w-full overflow-hidden bg-white/10">
                <div
                  className="h-full bg-[#22d3ee] shadow-[0_0_12px_#22d3ee] transition-[width] duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-widest text-white/45 uppercase">
                <span>{step}</span>
                <span className="tabular">{Math.round(pct)}%</span>
              </div>
            </div>

            <BootActions
              canEnter={canEnter}
              primaryRef={primaryRef}
              onEnterWithSound={onEnterWithSound}
              onEnterMuted={onEnterMuted}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils/cn";
import { BOOT_READY_LABEL, BOOT_STEPS } from "../constants/boot";
import { BootActions } from "./boot-actions";
import { BootBackdrop } from "./boot-backdrop";
import { BootHud } from "./boot-hud";
import { BootLog } from "./boot-log";
import { BootProgress } from "./boot-progress";
import { BootWordmark } from "./boot-wordmark";

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
            "fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-6 pb-[8vh] outline-none",
            "transition-opacity duration-700 ease-out",
            exiting ? "opacity-0" : "opacity-100",
          )}
        >
          <BootBackdrop />
          <BootHud />

          <div
            className={cn(
              "relative flex w-full max-w-md flex-col items-center gap-8 text-center",
              !exiting && "world-intro-rise",
            )}
          >
            <Dialog.Title className="sr-only">
              Entering {siteConfig.name}&rsquo;s studio
            </Dialog.Title>

            <BootWordmark />

            <BootLog pct={pct} ready={canEnter} />

            <BootProgress pct={pct} step={step} ready={canEnter} />

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

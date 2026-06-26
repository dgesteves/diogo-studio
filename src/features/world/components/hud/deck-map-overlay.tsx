"use client";

import type { ReactElement } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useActiveStation } from "../../hooks/use-active-station";
import { useHoveredStation } from "../../hooks/use-hovered-station";
import { DeckComms } from "./deck-comms";
import { DeckSectorList } from "./deck-sector-list";
import { DeckStationMap } from "./deck-station-map";

type DeckMapOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeckMapOverlay({ open, onOpenChange }: DeckMapOverlayProps): ReactElement {
  const active = useActiveStation();
  const hovered = useHoveredStation();
  const close = (): void => onOpenChange(false);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-background/70 data-[state=open]:animate-in data-[state=open]:fade-in fixed inset-0 z-50 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="border-border-strong bg-surface/95 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border p-5 shadow-2xl backdrop-blur-xl outline-none sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-accent font-mono text-[10px] tracking-[0.22em] uppercase">
                Studio map
              </p>
              <Dialog.Title className="text-foreground mt-1.5 text-xl font-medium tracking-tight">
                Navigate the studio
              </Dialog.Title>
            </div>
            <Dialog.Close
              aria-label="Close studio map"
              className="text-subtle-foreground hover:text-foreground hover:bg-surface-muted focus-visible:ring-ring grid size-8 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.35fr)]">
            <DeckStationMap active={active} hovered={hovered} onSelect={close} />
            <DeckSectorList active={active} hovered={hovered} onSelect={close} />
          </div>

          <div className="mt-5">
            <DeckComms />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

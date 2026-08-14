"use client";

import { Command } from "cmdk";
import { Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { type ReactElement } from "react";

import { stationSectors } from "@/content/pages";

import { ProfileGroup, ThemeGroup } from "./command-menu-actions";
import { Item, iconForPage } from "./command-menu-item";

export function NavigateView({ onClose }: { onClose: () => void }): ReactElement {
  const router = useRouter();
  const { setTheme } = useTheme();

  function runAndClose(action: () => void): void {
    onClose();
    requestAnimationFrame(action);
  }

  return (
    <Command label="Site command menu" className="flex flex-col">
      <div className="border-border flex items-center gap-2 border-b px-4">
        <Sparkles className="text-muted-foreground size-4" aria-hidden="true" />
        <Command.Input
          placeholder="Type a command, page, or question…"
          className="text-foreground placeholder:text-subtle-foreground h-12 flex-1 bg-transparent text-sm focus:outline-none"
        />
        <span className="text-subtle-foreground font-mono text-[10px] tracking-wider uppercase">
          ⌘K
        </span>
      </div>

      <Command.List className="max-h-[420px] overflow-y-auto px-2 py-2">
        <Command.Empty className="text-muted-foreground px-3 py-6 text-center text-sm">
          No results. Try <span className="text-foreground font-medium">studio</span> or{" "}
          <span className="text-foreground font-medium">about</span>.
        </Command.Empty>

        {/*
         * All seventeen routes, under the editorial grouping `content/pages.ts` authors.
         * A second, partial list of six lived in `config/navigation.ts` until Phase 2b and
         * had already stopped covering two thirds of the site.
         */}
        {stationSectors.map((sector) => (
          <Command.Group key={sector.label} heading={sector.label}>
            {sector.stations.map((station) => (
              <Item
                key={station.href}
                icon={iconForPage(station.href)}
                label={station.label}
                hint={station.href}
                onSelect={() => runAndClose(() => router.push(station.href))}
              />
            ))}
          </Command.Group>
        ))}

        <ThemeGroup run={runAndClose} setTheme={setTheme} />

        <ProfileGroup run={runAndClose} />
      </Command.List>
    </Command>
  );
}

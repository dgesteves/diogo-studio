"use client";

import { Command } from "cmdk";
import { Home, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { type ReactElement } from "react";

import { primaryNav } from "@/config/navigation";

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
          No results. Try <span className="text-foreground font-medium">home</span> or{" "}
          <span className="text-foreground font-medium">about</span>.
        </Command.Empty>

        <Command.Group heading="Pages">
          <Item
            icon={<Home className="size-4" />}
            label="Home"
            hint="/"
            onSelect={() => runAndClose(() => router.push("/"))}
          />
          {primaryNav.map((item) => (
            <Item
              key={item.href}
              icon={iconForPage(item.href)}
              label={item.label}
              hint={item.href}
              onSelect={() => runAndClose(() => router.push(item.href))}
            />
          ))}
        </Command.Group>

        <ThemeGroup run={runAndClose} setTheme={setTheme} />

        <ProfileGroup run={runAndClose} />
      </Command.List>
    </Command>
  );
}
